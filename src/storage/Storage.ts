/** One row of the top-30 list. */
export interface HighscoreEntry {
  name: string;
  score: number;
  /** When the game ended, as an ISO 8601 string. */
  date: string;
}

export interface InsertResult {
  /** 1-based place of the new row, or null if it did not make the list. */
  place: number | null;
  /** The list after inserting and trimming to 30, best first. */
  highscores: HighscoreEntry[];
}

/**
 * Everything the game persists. The desktop app uses SQLite through
 * `TauriStorage`; the web build used in tests swaps in an in-memory fake.
 * `Game` is the saved game state; it must survive a JSON round trip.
 */
export interface Storage<Game = unknown> {
  listHighscores(): Promise<HighscoreEntry[]>;
  /** Inserts a finished game, trims the list to 30 (ties keep the older game higher). */
  insertHighscore(entry: HighscoreEntry): Promise<InsertResult>;
  getLastName(): Promise<string | null>;
  setLastName(name: string): Promise<void>;
  saveGame(game: Game): Promise<void>;
  loadGame(): Promise<Game | null>;
  deleteGame(): Promise<void>;
}
