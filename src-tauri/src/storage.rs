//! SQLite persistence: the top-30 highscores, the last name used and the
//! unfinished game. Everything here is plain Rust so it can be tested
//! without Tauri; `commands.rs` exposes it to the frontend.

use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection, OptionalExtension};
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
];

const LAST_NAME_KEY: &str = "last_name";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HighscoreEntry {
    pub name: String,
    pub score: u32,
    /// When the game ended, as the ISO 8601 string the frontend sent.
    pub date: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct InsertResult {
    /// 1-based place of the new row, or `None` if it did not make the list.
    pub place: Option<u32>,
    pub highscores: Vec<HighscoreEntry>,
}

pub struct Store {
    conn: Connection,
}

impl Store {
    /// Opens the database at `path`, creating it if missing. A file that is
    /// not a usable SQLite database is moved aside to `<name>.corrupt` and a
    /// fresh one is created in its place.
    pub fn open(path: &Path) -> rusqlite::Result<Store> {
        match Self::open_existing(path) {
            Ok(store) => Ok(store),
            Err(_) => {
                discard_database(path);
                Self::open_existing(path)
            }
        }
    }

    pub fn open_in_memory() -> rusqlite::Result<Store> {
        Self::init(Connection::open_in_memory()?)
    }

    fn open_existing(path: &Path) -> rusqlite::Result<Store> {
        Self::init(Connection::open(path)?)
    }

    fn init(conn: Connection) -> rusqlite::Result<Store> {
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

    /// Best first; equal scores keep the older game higher.
    pub fn list_highscores(&self) -> rusqlite::Result<Vec<HighscoreEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT name, score, date FROM highscores ORDER BY score DESC, id ASC LIMIT ?1",
        )?;
        let rows = stmt.query_map([LIMIT], |row| {
            Ok(HighscoreEntry {
                name: row.get(0)?,
                score: row.get(1)?,
                date: row.get(2)?,
            })
        })?;
        rows.collect()
    }

    /// Inserts a finished game and trims the list to 30. The name is
    /// normalised the same way as on the frontend.
    pub fn insert_highscore(&mut self, entry: &HighscoreEntry) -> rusqlite::Result<InsertResult> {
        let tx = self.conn.transaction()?;
        tx.execute(
            "INSERT INTO highscores (name, score, date) VALUES (?1, ?2, ?3)",
            params![normalize_name(&entry.name), entry.score, entry.date],
        )?;
        let id = tx.last_insert_rowid();
        tx.execute(
            "DELETE FROM highscores WHERE id NOT IN
                 (SELECT id FROM highscores ORDER BY score DESC, id ASC LIMIT ?1)",
            [LIMIT],
        )?;
        let kept: bool = tx.query_row(
            "SELECT EXISTS (SELECT 1 FROM highscores WHERE id = ?1)",
            [id],
            |row| row.get(0),
        )?;
        let place = if kept {
            Some(tx.query_row(
                "SELECT COUNT(*) + 1 FROM highscores h, highscores me
                 WHERE me.id = ?1
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
            highscores: self.list_highscores()?,
        })
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

/// Moves an unusable database file (and its journal files) out of the way.
fn discard_database(path: &Path) {
    let _ = fs::rename(path, with_suffix(path, ".corrupt"));
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
        }
    }

    fn names(list: &[HighscoreEntry]) -> Vec<&str> {
        list.iter().map(|e| e.name.as_str()).collect()
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
        assert_eq!(store.list_highscores().unwrap(), result.highscores);
    }

    #[test]
    fn reports_place_of_new_entry() {
        let mut store = Store::open_in_memory().unwrap();
        store.insert_highscore(&entry("A", 50, "d1")).unwrap();
        let result = store.insert_highscore(&entry("B", 60, "d2")).unwrap();
        assert_eq!(result.place, Some(1));
    }

    #[test]
    fn trims_list_to_thirty() {
        let mut store = Store::open_in_memory().unwrap();
        for i in 0..MAX_HIGHSCORES as u32 {
            store
                .insert_highscore(&entry(&format!("P{i}"), 100 + i * 10, "d"))
                .unwrap();
        }
        assert_eq!(store.list_highscores().unwrap().len(), MAX_HIGHSCORES);

        // Beats the 30th (score 100): the 30th drops off.
        let result = store.insert_highscore(&entry("New", 105, "d")).unwrap();
        assert_eq!(result.place, Some(30));
        assert_eq!(result.highscores.len(), MAX_HIGHSCORES);
        assert_eq!(result.highscores.last().unwrap().name, "New");
        assert!(!names(&result.highscores).contains(&"P0"));

        // Equal to the 30th: the older game stays, the new one is not kept.
        let result = store.insert_highscore(&entry("Tie", 105, "d")).unwrap();
        assert_eq!(result.place, None);
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
        assert!(store.list_highscores().unwrap().is_empty());
        assert!(!with_suffix(&path, ".corrupt").exists());
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
        assert_eq!(names(&store.list_highscores().unwrap()), ["Ala"]);
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
        assert!(store.list_highscores().unwrap().is_empty());
        store.insert_highscore(&entry("Ala", 10, "d")).unwrap();
        assert!(with_suffix(&path, ".corrupt").exists());

        drop(store);
        let store = Store::open(&path).unwrap();
        assert_eq!(store.list_highscores().unwrap().len(), 1);
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
        assert!(store.list_highscores().unwrap().is_empty());
    }
}
