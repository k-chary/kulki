import type { HighscoreEntry } from '../highscores/ranking';

export type { HighscoreEntry };

export interface InsertResult {
  /** 1-based place of the new row, or null if it did not make the list. */
  place: number | null;
  /** The new row's id for `renameHighscore`, or null if it did not make the list. */
  id: number | null;
  /** The list after inserting and trimming to 30, best first. */
  highscores: HighscoreEntry[];
}

/**
 * Everything the game persists. The desktop app uses SQLite through
 * `TauriStorage`; the web build used in tests swaps in an in-memory fake.
 * `Game` is the saved game state; it must survive a JSON round trip.
 */
export interface Storage<Game = unknown> {
  /** The top 30 of one color count, best first. */
  listHighscores(colorCount: number): Promise<HighscoreEntry[]>;
  /**
   * Inserts a finished game into the list of `entry.colorCount` and trims that list
   * to 30 (ties keep the older game higher). Other counts' lists are untouched.
   */
  insertHighscore(entry: HighscoreEntry): Promise<InsertResult>;
  /** Gives row `id` a new name (trimmed, cut to 20, empty = „Gracz”); returns the list of that row's count
   * (empty if the row is gone). */
  renameHighscore(id: number, name: string): Promise<HighscoreEntry[]>;
  getLastName(): Promise<string | null>;
  setLastName(name: string): Promise<void>;
  /** The color count of the last game started (5 to 9), or null when none was chosen yet. */
  getLastColorCount(): Promise<number | null>;
  setLastColorCount(colorCount: number): Promise<void>;
  saveGame(game: Game): Promise<void>;
  loadGame(): Promise<Game | null>;
  deleteGame(): Promise<void>;
}
