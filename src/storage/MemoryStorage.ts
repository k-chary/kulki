import { placeFor, MAX_ENTRIES, normalizeName, type HighscoreEntry } from '../highscores/ranking';
import type { InsertResult, Storage } from './Storage';

/** The part of the browser's `localStorage` the web build needs. */
export type Backing = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

const BACKING_KEY = 'kulki:v1';

/**
 * `Storage` that keeps everything in memory: used by the web build the end-to-end
 * tests run against, and by unit tests. The saved game goes through JSON like it
 * does in SQLite, so a game that cannot round-trip fails here too. With a
 * `backing` (the web build passes `localStorage`) everything also survives a
 * reload; a backing that throws or holds junk is ignored.
 */
export class MemoryStorage<Game = unknown> implements Storage<Game> {
  /** Best first; each row keeps the id `renameHighscore` addresses it by. */
  private rows: { id: number; entry: HighscoreEntry }[] = [];
  private nextId = 1;
  private lastName: string | null = null;
  private game: string | null = null;
  private readonly backing: Backing | undefined;

  constructor(backing?: Backing) {
    this.backing = backing;
    this.restore();
  }

  private restore(): void {
    try {
      const text = this.backing?.getItem(BACKING_KEY);
      if (!text) return;
      const data = JSON.parse(text) as {
        highscores?: (HighscoreEntry & { id?: number })[];
        lastName?: string | null;
        game?: string | null;
      };
      const stored = Array.isArray(data.highscores) ? data.highscores : [];
      this.rows = stored.map(({ id, ...entry }, i) => ({
        id: typeof id === 'number' ? id : i + 1,
        entry,
      }));
      this.nextId = Math.max(0, ...this.rows.map((row) => row.id)) + 1;
      this.lastName = typeof data.lastName === 'string' ? data.lastName : null;
      this.game = typeof data.game === 'string' ? data.game : null;
    } catch {
      // Unreadable backing: start empty.
    }
  }

  private persist(): void {
    try {
      this.backing?.setItem(
        BACKING_KEY,
        JSON.stringify({
          highscores: this.rows.map(({ id, entry }) => ({ ...entry, id })),
          lastName: this.lastName,
          game: this.game,
        }),
      );
    } catch {
      // Storage full or blocked: keep going in memory.
    }
  }

  async listHighscores(): Promise<HighscoreEntry[]> {
    return this.rows.map(({ entry }) => ({ ...entry }));
  }

  async insertHighscore(entry: HighscoreEntry): Promise<InsertResult> {
    const place = placeFor(
      entry.score,
      this.rows.map((row) => row.entry),
    );
    if (place > MAX_ENTRIES) {
      return { place: null, id: null, highscores: await this.listHighscores() };
    }
    const id = this.nextId++;
    this.rows.splice(place - 1, 0, { id, entry: { ...entry, name: normalizeName(entry.name) } });
    this.rows = this.rows.slice(0, MAX_ENTRIES);
    this.persist();
    return { place, id, highscores: await this.listHighscores() };
  }

  async renameHighscore(id: number, name: string): Promise<HighscoreEntry[]> {
    const row = this.rows.find((candidate) => candidate.id === id);
    if (row) {
      row.entry = { ...row.entry, name: normalizeName(name) };
      this.persist();
    }
    return this.listHighscores();
  }

  async getLastName(): Promise<string | null> {
    return this.lastName;
  }

  async setLastName(name: string): Promise<void> {
    this.lastName = name;
    this.persist();
  }

  async saveGame(game: Game): Promise<void> {
    this.game = JSON.stringify(game);
    this.persist();
  }

  async loadGame(): Promise<Game | null> {
    return this.game === null ? null : (JSON.parse(this.game) as Game);
  }

  async deleteGame(): Promise<void> {
    this.game = null;
    this.persist();
  }
}
