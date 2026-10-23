// Deterministic starts for the end-to-end tests, read from the page URL:
//   ?seed=7                    a seeded random generator for the whole session
//   ?board=<9 rows split by />  a fixture board, e.g. rrrr...../......... (r o y g b p, . empty)
//   &preview=rgb               the colors of the next balls (default: red, red, red)
// Only available in dev and in the build made for the tests (VITE_E2E=1), never in a release.
import { type Color, type GameState, type Rng, createRng, SPAWN_COUNT } from '../rules';
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

export function startFromSearch(search: string, enabled = hookEnabled()): Start {
  const params = new URLSearchParams(search);
  const seed = params.get('seed');
  const board = params.get('board');
  if (!enabled || (seed === null && board === null)) return { rng: Math.random };

  const rng = seed === null ? Math.random : createRng(Number(seed));
  if (board === null) return { rng };
  const preview = parsePreview(params.get('preview') ?? 'rrr');
  return {
    rng,
    game: {
      board: parseBoard(board.replaceAll('/', '\n')),
      preview,
      score: 0,
      cleared: 0,
      gameOver: false,
    },
  };
}
