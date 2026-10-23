/**
 * An ISO 8601 date as dd.mm.rrrr in the local time zone, e.g. 18.10.2026.
 * Highscore dates are stored as ISO strings (src/highscores/ranking.ts).
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Not a date: ${iso}`);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}
