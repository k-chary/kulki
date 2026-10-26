import { BALL_THEMES, type BallTheme } from '../format/colors';
import {
  DEFAULT_COLOR_COUNT,
  MAX_ENTRIES,
  isColorCount,
  normalizeName,
  placeFor,
  type HighscoreEntry,
} from '../highscores/ranking';
import type { InsertResult, Storage } from './Storage';

/** The part of the browser's `localStorage` the web build needs. */
export type Backing = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

const BACKING_KEY = 'kulki:v1';

function isBallTheme(value: unknown): value is BallTheme {
  return BALL_THEMES.includes(value as BallTheme);
}

/**
 * `Storage` that keeps everything in memory: used by the web build the end-to-end
 * tests run against, and by unit tests. The saved game goes through JSON like it
 * does in SQLite, so a game that cannot round-trip fails here too. With a
 * `backing` (the web build passes `localStorage`) everything also survives a
 * reload; a backing that throws or holds junk is ignored.
 */
export class MemoryStorage<Game = unknown> implements Storage<Game> {
  /** All counts' rows, best first within a count; each keeps the id `renameHighscore` addresses it by. */
  private rows: { id: number; entry: HighscoreEntry }[] = [];
  private nextId = 1;
  private lastName: string | null = null;
  private lastColorCount: number | null = null;
  private ballTheme: BallTheme | null = null;
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
        highscores?: (Omit<HighscoreEntry, 'colorCount'> & { colorCount?: number; id?: number })[];
        lastName?: string | null;
        lastColorCount?: number | null;
        ballTheme?: unknown;
        game?: string | null;
      };
      const stored = Array.isArray(data.highscores) ? data.highscores : [];
      this.rows = stored.map(({ id, ...entry }, i) => ({
        id: typeof id === 'number' ? id : i + 1,
        // Scores saved before color counts existed belong to the 6-color list.
        entry: {
          ...entry,
          colorCount: isColorCount(entry.colorCount) ? entry.colorCount : DEFAULT_COLOR_COUNT,
        },
      }));
      this.nextId = Math.max(0, ...this.rows.map((row) => row.id)) + 1;
      this.lastName = typeof data.lastName === 'string' ? data.lastName : null;
      this.lastColorCount = isColorCount(data.lastColorCount) ? data.lastColorCount : null;
      this.ballTheme = isBallTheme(data.ballTheme) ? data.ballTheme : null;
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
          lastColorCount: this.lastColorCount,
          ballTheme: this.ballTheme,
          game: this.game,
        }),
      );
    } catch {
      // Storage full or blocked: keep going in memory.
    }
  }

  private listRows(colorCount: number) {
    return this.rows.filter((row) => row.entry.colorCount === colorCount);
  }

  private listOf(colorCount: number): HighscoreEntry[] {
    return this.listRows(colorCount).map(({ entry }) => entry);
  }

  async listHighscores(colorCount: number): Promise<HighscoreEntry[]> {
    return this.listOf(colorCount).map((entry) => ({ ...entry }));
  }

  async insertHighscore(entry: HighscoreEntry): Promise<InsertResult> {
    const { colorCount } = entry;
    const place = placeFor(entry.score, this.listOf(colorCount));
    if (place > MAX_ENTRIES) {
      return { place: null, id: null, highscores: await this.listHighscores(colorCount) };
    }
    const id = this.nextId++;
    // Within a count the rows stay best first; the new one goes before the first row it beats.
    const below = this.listRows(colorCount)[place - 1];
    const row = { id, entry: { ...entry, name: normalizeName(entry.name) } };
    this.rows.splice(below ? this.rows.indexOf(below) : this.rows.length, 0, row);
    const dropped = this.listRows(colorCount).slice(MAX_ENTRIES);
    this.rows = this.rows.filter((candidate) => !dropped.includes(candidate));
    this.persist();
    return { place, id, highscores: await this.listHighscores(colorCount) };
  }

  async renameHighscore(id: number, name: string): Promise<HighscoreEntry[]> {
    const row = this.rows.find((candidate) => candidate.id === id);
    if (row) {
      row.entry = { ...row.entry, name: normalizeName(name) };
      this.persist();
      return this.listHighscores(row.entry.colorCount);
    }
    return [];
  }

  async getLastName(): Promise<string | null> {
    return this.lastName;
  }

  async setLastName(name: string): Promise<void> {
    this.lastName = name;
    this.persist();
  }

  async getLastColorCount(): Promise<number | null> {
    return this.lastColorCount;
  }

  async setLastColorCount(colorCount: number): Promise<void> {
    if (!isColorCount(colorCount)) throw new RangeError(`bad color count: ${colorCount}`);
    this.lastColorCount = colorCount;
    this.persist();
  }

  async getBallTheme(): Promise<BallTheme | null> {
    return this.ballTheme;
  }

  async setBallTheme(theme: BallTheme): Promise<void> {
    if (!isBallTheme(theme)) throw new RangeError(`bad ball theme: ${String(theme)}`);
    this.ballTheme = theme;
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
