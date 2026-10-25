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
  brown: 'brązowa',
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

/** The look of the balls, picked in „Opcje”. Only the look: the rules never see it. */
export type BallTheme = 'classic' | 'candy';

export const BALL_THEMES: readonly BallTheme[] = ['classic', 'candy'];

export const BALL_THEME_NAMES: Record<BallTheme, string> = {
  classic: 'Klasyczne',
  candy: 'Cukierkowe',
};

/** One line under each theme's name in „Opcje”. */
export const BALL_THEME_HINTS: Record<BallTheme, string> = {
  classic: 'Spokojne barwy',
  candy: 'Żywe jak draże czekoladowe',
};
