//! SQLite persistence: the top-30 highscores of each color count, the last
//! name and color count used and the unfinished game. Everything here is plain Rust so it can be tested
//! without Tauri; `commands.rs` exposes it to the frontend.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, ErrorCode, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// How many scores the list keeps.
pub const MAX_HIGHSCORES: usize = 30;
/// `MAX_HIGHSCORES` as an SQL parameter.
const LIMIT: i64 = MAX_HIGHSCORES as i64;
/// Longest name a score row can hold, in characters.
pub const MAX_NAME_CHARS: usize = 20;
/// Name used when the player leaves the field empty.
pub const DEFAULT_NAME: &str = "Gracz";
/// How long a statement waits for a lock held by another connection.
const BUSY_TIMEOUT: Duration = Duration::from_secs(5);

/// Each entry upgrades the schema by one version; `PRAGMA user_version`
/// records how many have run. Append new steps, never edit old ones.
const MIGRATIONS: &[&str] = &[
    // 1: highscores, settings and the single saved game.
    "CREATE TABLE highscores (
         id    INTEGER PRIMARY KEY AUTOINCREMENT,
         name  TEXT    NOT NULL,
         score INTEGER NOT NULL,
         date  TEXT    NOT NULL
     );
     CREATE TABLE settings (
         key   TEXT PRIMARY KEY,
         value TEXT NOT NULL
     );
     CREATE TABLE saved_game (
         id   INTEGER PRIMARY KEY CHECK (id = 1),
         data TEXT NOT NULL
     );",
    // 2: a list per color count. Rows saved before it belong to the 6-color list.
    "ALTER TABLE highscores ADD COLUMN color_count INTEGER NOT NULL DEFAULT 6;
     CREATE INDEX highscores_by_count ON highscores (color_count, score DESC, id ASC);",
];

const LAST_NAME_KEY: &str = "last_name";
const LAST_COLOR_COUNT_KEY: &str = "last_color_count";
const BALL_THEME_KEY: &str = "ball_theme";
/// The ball themes the frontend knows (`BallTheme` in `src/format/colors.ts`).
pub const BALL_THEMES: [&str; 3] = ["classic", "candy", "cats"];
/// The fewest and most ball colors a game can use.
pub const MIN_COLOR_COUNT: u8 = 5;
pub const MAX_COLOR_COUNT: u8 = 9;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HighscoreEntry {
    pub name: String,
    pub score: u32,
    /// When the game ended, as the ISO 8601 string the frontend sent.
    pub date: String,
    /// How many ball colors the game used; the score goes in that count's list.
    #[serde(rename = "colorCount")]
    pub color_count: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct InsertResult {
    /// 1-based place of the new row, or `None` if it did not make the list.
    pub place: Option<u32>,
    /// The new row's id for `rename_highscore`, or `None` if it did not make the list.
    pub id: Option<i64>,
    pub highscores: Vec<HighscoreEntry>,
}

pub struct Store {
    conn: Connection,
}

impl Store {
    /// Opens the database at `path`, creating it if missing. A file that is
    /// not a usable SQLite database is moved aside to `<name>.corrupt-<time>`
    /// and a fresh one is created in its place. Any other error (a lock held
    /// too long, a permission or disk problem) is returned and the file is
    /// left alone, so the highscores are never thrown away by mistake.
    pub fn open(path: &Path) -> rusqlite::Result<Store> {
        match Self::open_existing(path) {
            Err(error) if is_corrupt(&error) => {
                discard_database(path);
                Self::open_existing(path)
            }
            result => result,
        }
    }

    pub fn open_in_memory() -> rusqlite::Result<Store> {
        Self::init(Connection::open_in_memory()?)
    }

    fn open_existing(path: &Path) -> rusqlite::Result<Store> {
        Self::init(Connection::open(path)?)
    }

    fn init(conn: Connection) -> rusqlite::Result<Store> {
        conn.busy_timeout(BUSY_TIMEOUT)?;
        let check: String = conn.query_row("PRAGMA quick_check", [], |row| row.get(0))?;
        if check != "ok" {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CORRUPT),
                Some(check),
            ));
        }
        let mut store = Store { conn };
        store.migrate()?;
        Ok(store)
    }

    fn migrate(&mut self) -> rusqlite::Result<()> {
        let version: i64 = self
            .conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))?;
        for (index, sql) in MIGRATIONS.iter().enumerate().skip(version as usize) {
            let tx = self.conn.transaction()?;
            tx.execute_batch(sql)?;
            tx.pragma_update(None, "user_version", index as i64 + 1)?;
            tx.commit()?;
        }
        Ok(())
    }

    /// The list of one color count, best first; equal scores keep the older game higher.
    pub fn list_highscores(&self, color_count: u8) -> rusqlite::Result<Vec<HighscoreEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT name, score, date, color_count FROM highscores
             WHERE color_count = ?1 ORDER BY score DESC, id ASC LIMIT ?2",
        )?;
        let rows = stmt.query_map(params![color_count, LIMIT], |row| {
            Ok(HighscoreEntry {
                name: row.get(0)?,
                score: row.get(1)?,
                date: row.get(2)?,
                color_count: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    /// Inserts a finished game into its color count's list and trims that
    /// list to 30; other counts are untouched. The name is normalised the
    /// same way as on the frontend.
    pub fn insert_highscore(&mut self, entry: &HighscoreEntry) -> rusqlite::Result<InsertResult> {
        check_color_count(entry.color_count)?;
        let count = entry.color_count;
        let tx = self.conn.transaction()?;
        tx.execute(
            "INSERT INTO highscores (name, score, date, color_count) VALUES (?1, ?2, ?3, ?4)",
            params![normalize_name(&entry.name), entry.score, entry.date, count],
        )?;
        let id = tx.last_insert_rowid();
        tx.execute(
            "DELETE FROM highscores WHERE color_count = ?1 AND id NOT IN
                 (SELECT id FROM highscores WHERE color_count = ?1
                  ORDER BY score DESC, id ASC LIMIT ?2)",
            params![count, LIMIT],
        )?;
        let kept: bool = tx.query_row(
            "SELECT EXISTS (SELECT 1 FROM highscores WHERE id = ?1)",
            [id],
            |row| row.get(0),
        )?;
        let place = if kept {
            Some(tx.query_row(
                "SELECT COUNT(*) + 1 FROM highscores h, highscores me
                 WHERE me.id = ?1 AND h.color_count = me.color_count
                   AND (h.score > me.score OR (h.score = me.score AND h.id < me.id))",
                [id],
                |row| row.get(0),
            )?)
        } else {
            None
        };
        tx.commit()?;
        Ok(InsertResult {
            place,
            id: kept.then_some(id),
            highscores: self.list_highscores(count)?,
        })
    }

    /// Gives the row `id` a new name (normalised like on insert) and returns
    /// the list of its color count. Renaming a row that is gone changes
    /// nothing and returns an empty list.
    pub fn rename_highscore(&self, id: i64, name: &str) -> rusqlite::Result<Vec<HighscoreEntry>> {
        self.conn.execute(
            "UPDATE highscores SET name = ?1 WHERE id = ?2",
            params![normalize_name(name), id],
        )?;
        let count: Option<u8> = self
            .conn
            .query_row(
                "SELECT color_count FROM highscores WHERE id = ?1",
                [id],
                |row| row.get(0),
            )
            .optional()?;
        match count {
            Some(count) => self.list_highscores(count),
            None => Ok(Vec::new()),
        }
    }

    pub fn last_name(&self) -> rusqlite::Result<Option<String>> {
        self.conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?1",
                [LAST_NAME_KEY],
                |row| row.get(0),
            )
            .optional()
    }

    pub fn set_last_name(&self, name: &str) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value",
            params![LAST_NAME_KEY, normalize_name(name)],
        )?;
        Ok(())
    }

    /// The color count of the last game started, or `None` if none was
    /// chosen yet (or the stored value is not a valid count).
    pub fn last_color_count(&self) -> rusqlite::Result<Option<u8>> {
        let value: Option<String> = self
            .conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?1",
                [LAST_COLOR_COUNT_KEY],
                |row| row.get(0),
            )
            .optional()?;
        Ok(value
            .and_then(|text| text.parse::<u8>().ok())
            .filter(|count| (MIN_COLOR_COUNT..=MAX_COLOR_COUNT).contains(count)))
    }

    pub fn set_last_color_count(&self, color_count: u8) -> rusqlite::Result<()> {
        check_color_count(color_count)?;
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value",
            params![LAST_COLOR_COUNT_KEY, color_count.to_string()],
        )?;
        Ok(())
    }

    /// The ball theme picked in „Opcje”, or `None` if none was picked yet (or
    /// the stored value is not a known theme); the caller treats that as classic.
    pub fn ball_theme(&self) -> rusqlite::Result<Option<String>> {
        let value: Option<String> = self
            .conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?1",
                [BALL_THEME_KEY],
                |row| row.get(0),
            )
            .optional()?;
        Ok(value.filter(|theme| BALL_THEMES.contains(&theme.as_str())))
    }

    pub fn set_ball_theme(&self, theme: &str) -> rusqlite::Result<()> {
        if !BALL_THEMES.contains(&theme) {
            return Err(rusqlite::Error::InvalidParameterName(format!(
                "ball theme {theme:?} is not one of {BALL_THEMES:?}"
            )));
        }
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value",
            params![BALL_THEME_KEY, theme],
        )?;
        Ok(())
    }

    /// Replaces the saved game. The game is stored as JSON exactly as the
    /// frontend sent it; its shape belongs to the rules module.
    pub fn save_game(&self, game: &Value) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO saved_game (id, data) VALUES (1, ?1)
             ON CONFLICT (id) DO UPDATE SET data = excluded.data",
            [game.to_string()],
        )?;
        Ok(())
    }

    /// The saved game, or `None` if there is none. A save that is not valid
    /// JSON is deleted and treated as missing.
    pub fn load_game(&self) -> rusqlite::Result<Option<Value>> {
        let data: Option<String> = self
            .conn
            .query_row("SELECT data FROM saved_game WHERE id = 1", [], |row| {
                row.get(0)
            })
            .optional()?;
        match data.map(|text| serde_json::from_str(&text)) {
            None => Ok(None),
            Some(Ok(game)) => Ok(Some(game)),
            Some(Err(_)) => {
                self.delete_game()?;
                Ok(None)
            }
        }
    }

    pub fn delete_game(&self) -> rusqlite::Result<()> {
        self.conn.execute("DELETE FROM saved_game", [])?;
        Ok(())
    }
}

/// Rejects a color count outside 5 to 9, so no stray list is ever created.
fn check_color_count(color_count: u8) -> rusqlite::Result<()> {
    if (MIN_COLOR_COUNT..=MAX_COLOR_COUNT).contains(&color_count) {
        Ok(())
    } else {
        Err(rusqlite::Error::InvalidParameterName(format!(
            "color count {color_count} is not {MIN_COLOR_COUNT} to {MAX_COLOR_COUNT}"
        )))
    }
}

/// Trims, caps at 20 characters and falls back to „Gracz” when empty.
pub fn normalize_name(name: &str) -> String {
    let trimmed: String = name.trim().chars().take(MAX_NAME_CHARS).collect();
    let trimmed = trimmed.trim_end();
    if trimmed.is_empty() {
        DEFAULT_NAME.to_string()
    } else {
        trimmed.to_string()
    }
}

/// Whether `error` means the file is not a usable database, as opposed to
/// one that is only busy or out of reach right now.
fn is_corrupt(error: &rusqlite::Error) -> bool {
    matches!(
        error,
        rusqlite::Error::SqliteFailure(e, _)
            if matches!(e.code, ErrorCode::DatabaseCorrupt | ErrorCode::NotADatabase)
    )
}

/// Moves an unusable database file (and its journal files) out of the way,
/// stamped with the time so an earlier discarded copy is kept too.
fn discard_database(path: &Path) {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_secs());
    let _ = fs::rename(path, with_suffix(path, &format!(".corrupt-{stamp}")));
    for suffix in ["-wal", "-shm", "-journal"] {
        let _ = fs::remove_file(with_suffix(path, suffix));
    }
}

fn with_suffix(path: &Path, suffix: &str) -> PathBuf {
    let mut name = path.as_os_str().to_os_string();
    name.push(suffix);
    PathBuf::from(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn entry(name: &str, score: u32, date: &str) -> HighscoreEntry {
        HighscoreEntry {
            name: name.to_string(),
            score,
            date: date.to_string(),
            color_count: 6,
        }
    }

    fn entry_of(count: u8, name: &str, score: u32) -> HighscoreEntry {
        HighscoreEntry {
            color_count: count,
            ..entry(name, score, "d")
        }
    }

    fn names(list: &[HighscoreEntry]) -> Vec<&str> {
        list.iter().map(|e| e.name.as_str()).collect()
    }

    /// The discarded copies of `path`, `<name>.corrupt-<time>`.
    fn discarded(path: &Path) -> usize {
        let prefix = format!("{}.corrupt-", path.file_name().unwrap().to_string_lossy());
        fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter(|item| {
                item.as_ref()
                    .unwrap()
                    .file_name()
                    .to_string_lossy()
                    .starts_with(&prefix)
            })
            .count()
    }

    #[test]
    fn ranks_by_score_and_keeps_older_tie_higher() {
        let mut store = Store::open_in_memory().unwrap();
        store
            .insert_highscore(&entry("Ala", 100, "2026-10-01"))
            .unwrap();
        store
            .insert_highscore(&entry("Ola", 200, "2026-10-02"))
            .unwrap();
        let result = store
            .insert_highscore(&entry("Ela", 100, "2026-10-03"))
            .unwrap();

        assert_eq!(result.place, Some(3));
        assert_eq!(names(&result.highscores), ["Ola", "Ala", "Ela"]);
        assert_eq!(store.list_highscores(6).unwrap(), result.highscores);
    }

    #[test]
    fn reports_place_of_new_entry() {
        let mut store = Store::open_in_memory().unwrap();
        store.insert_highscore(&entry("A", 50, "d1")).unwrap();
        let result = store.insert_highscore(&entry("B", 60, "d2")).unwrap();
        assert_eq!(result.place, Some(1));
        assert!(result.id.is_some());
    }

    #[test]
    fn renames_a_row_by_id() {
        let mut store = Store::open_in_memory().unwrap();
        store.insert_highscore(&entry("Ala", 90, "d1")).unwrap();
        let result = store.insert_highscore(&entry("Gracz", 50, "d2")).unwrap();
        let list = store
            .rename_highscore(result.id.unwrap(), "  Ola  ")
            .unwrap();
        assert_eq!(names(&list), ["Ala", "Ola"]);
        // Renaming again is harmless, so a retried save never adds a row.
        let list = store.rename_highscore(result.id.unwrap(), "Ola").unwrap();
        assert_eq!(names(&list), ["Ala", "Ola"]);
        let list = store.rename_highscore(result.id.unwrap(), "").unwrap();
        assert_eq!(names(&list), ["Ala", DEFAULT_NAME]);
    }

    #[test]
    fn trims_list_to_thirty() {
        let mut store = Store::open_in_memory().unwrap();
        for i in 0..MAX_HIGHSCORES as u32 {
            store
                .insert_highscore(&entry(&format!("P{i}"), 100 + i * 10, "d"))
                .unwrap();
        }
        assert_eq!(store.list_highscores(6).unwrap().len(), MAX_HIGHSCORES);

        // Beats the 30th (score 100): the 30th drops off.
        let result = store.insert_highscore(&entry("New", 105, "d")).unwrap();
        assert_eq!(result.place, Some(30));
        assert_eq!(result.highscores.len(), MAX_HIGHSCORES);
        assert_eq!(result.highscores.last().unwrap().name, "New");
        assert!(!names(&result.highscores).contains(&"P0"));

        // Equal to the 30th: the older game stays, the new one is not kept.
        let result = store.insert_highscore(&entry("Tie", 105, "d")).unwrap();
        assert_eq!(result.place, None);
        assert_eq!(result.id, None);
        assert_eq!(result.highscores.len(), MAX_HIGHSCORES);
        assert!(!names(&result.highscores).contains(&"Tie"));

        let count: i64 = store
            .conn
            .query_row("SELECT COUNT(*) FROM highscores", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, LIMIT);
    }

    #[test]
    fn normalizes_names() {
        assert_eq!(normalize_name("  Żaneta  "), "Żaneta");
        assert_eq!(normalize_name("   "), DEFAULT_NAME);
        assert_eq!(normalize_name(""), DEFAULT_NAME);
        assert_eq!(
            normalize_name("ąęółśżźćńąęółśżźćńąęó"),
            "ąęółśżźćńąęółśżźćńąę"
        );
        assert_eq!(normalize_name("ąęółśżźćńąęółśżźćńąęó").chars().count(), 20);

        let mut store = Store::open_in_memory().unwrap();
        let result = store.insert_highscore(&entry("  ", 10, "d")).unwrap();
        assert_eq!(result.highscores[0].name, DEFAULT_NAME);
    }

    #[test]
    fn remembers_last_name() {
        let store = Store::open_in_memory().unwrap();
        assert_eq!(store.last_name().unwrap(), None);
        store.set_last_name("Kasia").unwrap();
        store.set_last_name(" Basia ").unwrap();
        assert_eq!(store.last_name().unwrap().as_deref(), Some("Basia"));
    }

    #[test]
    fn save_load_delete_round_trip() {
        let store = Store::open_in_memory().unwrap();
        assert_eq!(store.load_game().unwrap(), None);

        let game = json!({ "board": [[null, 2], [5, null]], "score": 50, "cleared": 5, "preview": [1, 3, 4] });
        store.save_game(&game).unwrap();
        assert_eq!(store.load_game().unwrap(), Some(game));

        let next = json!({ "board": [], "score": 60, "cleared": 6, "preview": [0, 0, 0] });
        store.save_game(&next).unwrap();
        assert_eq!(store.load_game().unwrap(), Some(next));

        store.delete_game().unwrap();
        assert_eq!(store.load_game().unwrap(), None);
    }

    #[test]
    fn unreadable_save_is_dropped() {
        let store = Store::open_in_memory().unwrap();
        store
            .conn
            .execute(
                "INSERT INTO saved_game (id, data) VALUES (1, 'not json')",
                [],
            )
            .unwrap();
        assert_eq!(store.load_game().unwrap(), None);
        assert_eq!(store.load_game().unwrap(), None);
    }

    #[test]
    fn migrates_an_empty_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        fs::write(&path, b"").unwrap();

        let store = Store::open(&path).unwrap();
        let version: i64 = store
            .conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version as usize, MIGRATIONS.len());
        assert!(store.list_highscores(6).unwrap().is_empty());
        assert_eq!(discarded(&path), 0);
    }

    #[test]
    fn creates_a_missing_file_and_survives_reopen() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        {
            let mut store = Store::open(&path).unwrap();
            store.insert_highscore(&entry("Ala", 70, "d")).unwrap();
            store.set_last_name("Ala").unwrap();
            store.save_game(&json!({ "score": 70 })).unwrap();
        }
        let store = Store::open(&path).unwrap();
        assert_eq!(names(&store.list_highscores(6).unwrap()), ["Ala"]);
        assert_eq!(store.last_name().unwrap().as_deref(), Some("Ala"));
        assert_eq!(store.load_game().unwrap(), Some(json!({ "score": 70 })));
    }

    #[test]
    fn recovers_from_a_corrupt_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        fs::write(
            &path,
            b"this is definitely not a sqlite database, just junk bytes",
        )
        .unwrap();

        let mut store = Store::open(&path).unwrap();
        assert!(store.list_highscores(6).unwrap().is_empty());
        store.insert_highscore(&entry("Ala", 10, "d")).unwrap();
        assert_eq!(discarded(&path), 1);

        drop(store);
        let store = Store::open(&path).unwrap();
        assert_eq!(store.list_highscores(6).unwrap().len(), 1);
    }

    #[test]
    fn recovers_from_a_damaged_page() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        {
            let mut store = Store::open(&path).unwrap();
            for i in 0..MAX_HIGHSCORES as u32 {
                store.insert_highscore(&entry("x", i, "d")).unwrap();
            }
        }
        // Keep the valid header but overwrite everything after the first page.
        let mut bytes = fs::read(&path).unwrap();
        for byte in bytes.iter_mut().skip(4096) {
            *byte = 0xAB;
        }
        fs::write(&path, &bytes).unwrap();

        let store = Store::open(&path).unwrap();
        assert!(store.list_highscores(6).unwrap().is_empty());
    }

    #[test]
    fn waits_for_a_lock_instead_of_discarding_the_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        {
            let mut store = Store::open(&path).unwrap();
            store.insert_highscore(&entry("Ala", 70, "d")).unwrap();
        }
        // Another Kulki holds a write lock while this one starts.
        let other = Connection::open(&path).unwrap();
        other
            .execute_batch("BEGIN EXCLUSIVE; INSERT INTO settings VALUES ('x', 'y');")
            .unwrap();
        let holder = std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(300));
            other.execute_batch("COMMIT").unwrap();
        });

        let store = Store::open(&path).unwrap();
        holder.join().unwrap();
        assert_eq!(names(&store.list_highscores(6).unwrap()), ["Ala"]);
        assert_eq!(discarded(&path), 0);
    }

    #[test]
    fn only_corruption_discards_the_file() {
        let corrupt = rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CORRUPT),
            None,
        );
        let not_a_database = rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_NOTADB),
            None,
        );
        let busy = rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_BUSY),
            None,
        );
        let read_only = rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
            None,
        );
        assert!(is_corrupt(&corrupt));
        assert!(is_corrupt(&not_a_database));
        assert!(!is_corrupt(&busy));
        assert!(!is_corrupt(&read_only));
    }

    #[test]
    fn keeps_a_separate_list_per_color_count() {
        let mut store = Store::open_in_memory().unwrap();
        store.insert_highscore(&entry_of(6, "Six", 100)).unwrap();
        let result = store.insert_highscore(&entry_of(9, "Nine", 50)).unwrap();

        // 50 is the best of the 9-color list although it trails the 6-color one.
        assert_eq!(result.place, Some(1));
        assert_eq!(names(&result.highscores), ["Nine"]);
        assert_eq!(names(&store.list_highscores(6).unwrap()), ["Six"]);
        assert!(store.list_highscores(5).unwrap().is_empty());
    }

    #[test]
    fn trims_and_breaks_ties_within_one_count_only() {
        let mut store = Store::open_in_memory().unwrap();
        for i in 0..MAX_HIGHSCORES as u32 {
            store
                .insert_highscore(&entry_of(7, &format!("S{i}"), 100 + i * 10))
                .unwrap();
        }
        // The full 7-color list does not make room demands on another count.
        let result = store.insert_highscore(&entry_of(8, "Eight", 1)).unwrap();
        assert_eq!(result.place, Some(1));

        let result = store.insert_highscore(&entry_of(7, "Tie", 100)).unwrap();
        assert_eq!(result.place, None);
        let result = store.insert_highscore(&entry_of(7, "Beat", 105)).unwrap();
        assert_eq!(result.place, Some(30));
        assert_eq!(store.list_highscores(7).unwrap().len(), MAX_HIGHSCORES);
        assert_eq!(store.list_highscores(8).unwrap().len(), 1);

        // Equal scores in different counts do not tie with each other.
        let result = store.insert_highscore(&entry_of(8, "Same", 1)).unwrap();
        assert_eq!(result.place, Some(2));
    }

    #[test]
    fn renames_within_the_rows_own_list() {
        let mut store = Store::open_in_memory().unwrap();
        store.insert_highscore(&entry_of(6, "Six", 100)).unwrap();
        let id = store
            .insert_highscore(&entry_of(9, "Gracz", 50))
            .unwrap()
            .id
            .unwrap();
        let list = store.rename_highscore(id, "Ola").unwrap();
        assert_eq!(names(&list), ["Ola"]);
        assert_eq!(list[0].color_count, 9);
        assert!(store
            .rename_highscore(id + 100, "Nobody")
            .unwrap()
            .is_empty());
    }

    #[test]
    fn rejects_a_color_count_outside_five_to_nine() {
        let mut store = Store::open_in_memory().unwrap();
        assert!(store.insert_highscore(&entry_of(4, "A", 10)).is_err());
        assert!(store.insert_highscore(&entry_of(10, "A", 10)).is_err());
        assert!(store.set_last_color_count(4).is_err());
        assert!(store.set_last_color_count(10).is_err());
        assert_eq!(store.last_color_count().unwrap(), None);
    }

    #[test]
    fn remembers_last_color_count() {
        let store = Store::open_in_memory().unwrap();
        assert_eq!(store.last_color_count().unwrap(), None);
        store.set_last_color_count(8).unwrap();
        store.set_last_color_count(5).unwrap();
        assert_eq!(store.last_color_count().unwrap(), Some(5));

        // A stored value that is not a valid count reads as never set.
        store
            .conn
            .execute(
                "UPDATE settings SET value = 'many' WHERE key = ?1",
                [LAST_COLOR_COUNT_KEY],
            )
            .unwrap();
        assert_eq!(store.last_color_count().unwrap(), None);
    }

    #[test]
    fn remembers_the_ball_theme() {
        let store = Store::open_in_memory().unwrap();
        assert_eq!(store.ball_theme().unwrap(), None);
        store.set_ball_theme("candy").unwrap();
        assert_eq!(store.ball_theme().unwrap().as_deref(), Some("candy"));
        store.set_ball_theme("classic").unwrap();
        assert_eq!(store.ball_theme().unwrap().as_deref(), Some("classic"));
        store.set_ball_theme("cats").unwrap();
        assert_eq!(store.ball_theme().unwrap().as_deref(), Some("cats"));
    }

    #[test]
    fn rejects_an_unknown_ball_theme_and_reads_a_stored_one_as_unset() {
        let store = Store::open_in_memory().unwrap();
        store.set_ball_theme("candy").unwrap();
        assert!(store.set_ball_theme("neon").is_err());
        assert_eq!(store.ball_theme().unwrap().as_deref(), Some("candy"));

        store
            .conn
            .execute(
                "UPDATE settings SET value = 'neon' WHERE key = ?1",
                [BALL_THEME_KEY],
            )
            .unwrap();
        assert_eq!(store.ball_theme().unwrap(), None);
    }

    #[test]
    fn migrates_a_database_made_by_the_current_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("kulki.db");
        {
            // The schema as version 1 left it, with scores and a saved game.
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(MIGRATIONS[0]).unwrap();
            conn.pragma_update(None, "user_version", 1).unwrap();
            conn.execute(
                "INSERT INTO highscores (name, score, date) VALUES ('Ala', 300, 'd1'), ('Ola', 200, 'd2')",
                [],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO settings (key, value) VALUES ('last_name', 'Ola')",
                [],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO saved_game (id, data) VALUES (1, '{\"score\":70}')",
                [],
            )
            .unwrap();
        }

        let mut store = Store::open(&path).unwrap();
        assert_eq!(discarded(&path), 0);
        let version: i64 = store
            .conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version as usize, MIGRATIONS.len());

        // Old scores joined the 6-color list; nothing else was touched.
        let list = store.list_highscores(6).unwrap();
        assert_eq!(names(&list), ["Ala", "Ola"]);
        assert!(list.iter().all(|e| e.color_count == 6));
        assert!(store.list_highscores(7).unwrap().is_empty());
        assert_eq!(store.last_name().unwrap().as_deref(), Some("Ola"));
        assert_eq!(store.load_game().unwrap(), Some(json!({ "score": 70 })));

        // The migrated list ranks new scores as before.
        let result = store.insert_highscore(&entry_of(6, "Ela", 250)).unwrap();
        assert_eq!(result.place, Some(2));
    }
}
