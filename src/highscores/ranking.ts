// Top-30 highscore ranking. Pure functions, no storage or UI code.
//
// A list is always ordered best first. Equal scores keep the older game
// higher, so a new score goes below every stored score it ties with.

export const MAX_ENTRIES = 30;
export const MAX_NAME_LENGTH = 20;
export const DEFAULT_NAME = 'Gracz';

export interface HighscoreEntry {
  name: string;
  score: number;
  /** When the game ended, as an ISO 8601 string. */
  date: string;
}

export type HighscoreRow =
  | { kind: 'stored'; place: number; entry: HighscoreEntry }
  | { kind: 'live'; place: number; score: number };

/** The 1-based place a new score would take, counting past 30 if it does not fit. */
export function placeFor(score: number, list: readonly HighscoreEntry[]): number {
  return list.filter((entry) => entry.score >= score).length + 1;
}

/** Whether a new score enters the top 30. */
export function qualifies(score: number, list: readonly HighscoreEntry[]): boolean {
  return placeFor(score, list) <= MAX_ENTRIES;
}

/** Points a score lacks to beat the 30th entry; 0 when it already qualifies. */
export function pointsMissing(score: number, list: readonly HighscoreEntry[]): number {
  const last = list[MAX_ENTRIES - 1];
  if (last === undefined || qualifies(score, list)) return 0;
  return last.score + 1 - score;
}

/** A new list with the entry at its place, trimmed to 30. The input is not changed. */
export function insert(list: readonly HighscoreEntry[], entry: HighscoreEntry): HighscoreEntry[] {
  const index = placeFor(entry.score, list) - 1;
  return [...list.slice(0, index), entry, ...list.slice(index)].slice(0, MAX_ENTRIES);
}

/** Trims the name and cuts it to 20 characters; an empty name becomes „Gracz”. */
export function normalizeName(raw: string): string {
  const chars = Array.from(raw.normalize('NFC').trim());
  const name = chars.slice(0, MAX_NAME_LENGTH).join('').trimEnd();
  return name === '' ? DEFAULT_NAME : name;
}

/** The place of the „Ta gra · teraz” row, or null when the score is outside the top 30. */
export function livePlace(score: number, list: readonly HighscoreEntry[]): number | null {
  return qualifies(score, list) ? placeFor(score, list) : null;
}

/**
 * The rows the highscore list shows while a game is in progress: stored games
 * with the live row at its place, at most 30 rows in all.
 */
export function rowsWithLive(list: readonly HighscoreEntry[], score: number): HighscoreRow[] {
  const rows: HighscoreRow[] = list.map((entry, i) => ({ kind: 'stored', place: i + 1, entry }));
  const place = livePlace(score, list);
  if (place === null) return rows.slice(0, MAX_ENTRIES);
  rows.splice(place - 1, 0, { kind: 'live', place, score });
  return rows
    .slice(0, MAX_ENTRIES)
    .map((row, i) => (row.kind === 'stored' ? { ...row, place: i + 1 } : row));
}
