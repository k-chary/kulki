import type { Page } from '@playwright/test';

/** Nine rows of the fixture board for `?board=`; rows not given are empty. */
export function fixtureBoard(rows: Record<number, string>): string {
  return Array.from({ length: 9 }, (_, row) => (rows[row] ?? '').padEnd(9, '.')).join('/');
}

export async function openFixture(
  page: Page,
  options: {
    rows: Record<number, string>;
    preview?: string;
    seed?: number;
    scores?: number[];
    colors?: number;
  },
) {
  const query = new URLSearchParams({
    seed: String(options.seed ?? 1),
    board: fixtureBoard(options.rows),
    preview: options.preview ?? 'bbb',
  });
  if (options.scores) query.set('scores', options.scores.join(','));
  if (options.colors) query.set('colors', String(options.colors));
  await page.goto(`/?${query.toString()}`);
}

/** A board field by 0-based row and column. */
export const field = (page: Page, row: number, col: number) =>
  page.locator(`button[data-row="${row}"][data-col="${col}"]`);

export const balls = (page: Page) => page.locator('button[data-ball="true"]');

export const status = (page: Page) => page.getByRole('status');

const LETTERS = 'roygbp';

/**
 * Rows for `openFixture` with a full board except for the first three squares of the
 * top row, colored so that no two neighbours in any direction match. Moving the ball
 * from 0,3 to 0,0 clears nothing, so the three preview balls fill the board: game over.
 */
export function nearlyFullRows(): Record<number, string> {
  const rows: Record<number, string> = {};
  for (let row = 0; row < 9; row++) {
    rows[row] = Array.from({ length: 9 }, (_, col) =>
      row === 0 && col < 3 ? '.' : LETTERS[(row + 2 * col) % 6],
    ).join('');
  }
  return rows;
}

/** Plays the one move that fills the nearly full board. */
export async function playToGameOver(page: Page) {
  await field(page, 0, 3).click();
  await field(page, 0, 0).click();
}

export const gameOverDialog = (page: Page) => page.getByRole('dialog', { name: 'Koniec gry' });

/** A row of the highscore list by its `data-kind`. */
export const scoreRows = (page: Page, kind?: 'stored' | 'saved' | 'current') =>
  page.locator(kind ? `li[data-kind="${kind}"]` : 'li[data-kind]');
