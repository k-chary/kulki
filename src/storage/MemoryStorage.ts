import { insert, placeFor, MAX_ENTRIES, type HighscoreEntry } from '../highscores/ranking';
import type { InsertResult, Storage } from './Storage';

/**
 * `Storage` that keeps everything in memory: used by the web build the end-to-end
 * tests run against, and by unit tests. The saved game goes through JSON like it
 * does in SQLite, so a game that cannot round-trip fails here too.
 */
export class MemoryStorage<Game = unknown> implements Storage<Game> {
  private highscores: HighscoreEntry[] = [];
  private lastName: string | null = null;
  private game: string | null = null;

  async listHighscores(): Promise<HighscoreEntry[]> {
    return this.highscores.map((entry) => ({ ...entry }));
  }

  async insertHighscore(entry: HighscoreEntry): Promise<InsertResult> {
    const place = placeFor(entry.score, this.highscores);
    this.highscores = insert(this.highscores, entry);
    return {
      place: place <= MAX_ENTRIES ? place : null,
      highscores: await this.listHighscores(),
    };
  }

  async getLastName(): Promise<string | null> {
    return this.lastName;
  }

  async setLastName(name: string): Promise<void> {
    this.lastName = name;
  }

  async saveGame(game: Game): Promise<void> {
    this.game = JSON.stringify(game);
  }

  async loadGame(): Promise<Game | null> {
    return this.game === null ? null : (JSON.parse(this.game) as Game);
  }

  async deleteGame(): Promise<void> {
    this.game = null;
  }
}
