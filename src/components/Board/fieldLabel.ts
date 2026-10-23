import type { Color } from '../../rules';

/** Polish color names, in the feminine form that agrees with „kulka”. */
export const COLOR_NAMES: Record<Color, string> = {
  red: 'czerwona',
  orange: 'pomarańczowa',
  yellow: 'żółta',
  green: 'zielona',
  blue: 'niebieska',
  purple: 'fioletowa',
};

/** A field's accessible name, e.g. „Kulka czerwona, wiersz 4, kolumna 8” (1-based). */
export function fieldLabel(row: number, col: number, color: Color | null): string {
  const where = `wiersz ${row + 1}, kolumna ${col + 1}`;
  return color ? `Kulka ${COLOR_NAMES[color]}, ${where}` : `Puste pole, ${where}`;
}
