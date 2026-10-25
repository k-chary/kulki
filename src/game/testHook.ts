// Deterministic starts for the end-to-end tests, read from the page URL:
//   ?seed=7                    a seeded random generator for the whole session
//   ?board=<9 rows split by />  a fixture board, e.g. rrrr...../......... (r o y g b p, . empty)
//   &preview=rgb               the colors of the next balls (default: red, red, red)
//   ?scores=900,500,120        highscores already stored, best first (names „Gracz 1”, „Gracz 2”, …)
// Only available in dev and in the build made for the tests (VITE_E2E=1), never in a release.
import { DEFAULT_COLOR_COUNT, type HighscoreEntry } from '../highscores/ranking';
import {
  type Color,
  type GameState,
  type Rng,
  createRng,
  DEFAULT_COLORS,
  SPAWN_COUNT,
} from '../rules';
import { parseBoard } from '../rules/testing';

const LETTERS: Record<string, Color> = {
  r: 'red',
  o: 'orange',
  y: 'yellow',
  g: 'green',
  b: 'blue',
  p: 'purple',
};

export interface Start {
  rng: Rng;
  /** A fixture game; without one the screen starts a new game. */
  game?: GameState;
  /** Highscores to start with; empty without `scores`. */
  highscores: HighscoreEntry[];
}

export function hookEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_E2E === '1';
}

export function parsePreview(text: string): Color[] {
  const colors = [...text].map((letter) => LETTERS[letter]);
  if (colors.length !== SPAWN_COUNT || colors.some((color) => color === undefined)) {
    throw new Error(`preview needs ${SPAWN_COUNT} letters of ${Object.keys(LETTERS).join('')}`);
  }
  return colors as Color[];
}

export function parseScores(text: string): HighscoreEntry[] {
  return text
    .split(',')
    .filter((part) => part !== '')
    .map((part, i) => ({
      name: `Gracz ${i + 1}`,
      score: Number(part),
      date: '2026-01-15T12:00:00.000Z',
      colorCount: DEFAULT_COLOR_COUNT,
    }));
}

export function startFromSearch(search: string, enabled = hookEnabled()): Start {
  const params = new URLSearchParams(search);
  const seed = params.get('seed');
  const board = params.get('board');
  const scores = params.get('scores');
  if (!enabled || (seed === null && board === null && scores === null)) {
    return { rng: Math.random, highscores: [] };
  }

  const rng = seed === null ? Math.random : createRng(Number(seed));
  const highscores = parseScores(scores ?? '');
  if (board === null) return { rng, highscores };
  const preview = parsePreview(params.get('preview') ?? 'rrr');
  return {
    rng,
    highscores,
    game: {
      board: parseBoard(board.replaceAll('/', '\n')),
      preview,
      score: 0,
      colorCount: DEFAULT_COLORS,
      cleared: 0,
      gameOver: false,
    },
  };
}
