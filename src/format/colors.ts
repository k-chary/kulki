import type { Color } from '../rules';
import { plural } from './plural';

/** Polish color names, in the feminine form that agrees with „kulka”. */
export const COLOR_NAMES: Record<Color, string> = {
  red: 'czerwona',
  orange: 'pomarańczowa',
  yellow: 'żółta',
  green: 'zielona',
  blue: 'niebieska',
  purple: 'fioletowa',
  pink: 'różowa',
  white: 'biała',
  black: 'czarna',
};

/** The difficulty each color count stands for, as the „Kolory” panel names it. */
export const COLOR_COUNT_LEVELS: Readonly<Record<number, string>> = {
  5: 'łatwy',
  6: 'klasyczny',
  7: 'trudny',
  8: 'bardzo trudny',
  9: 'mistrzowski',
};

/** „1 kolor”, „4 kolory”, „6 kolorów”. */
export function formatColorCount(count: number): string {
  return `${count} ${plural(count, 'kolor', 'kolory', 'kolorów')}`;
}
