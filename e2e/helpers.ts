import type { Page } from '@playwright/test';

/** Nine rows of the fixture board for `?board=`; rows not given are empty. */
export function fixtureBoard(rows: Record<number, string>): string {
  return Array.from({ length: 9 }, (_, row) => (rows[row] ?? '').padEnd(9, '.')).join('/');
}

export async function openFixture(
  page: Page,
  options: { rows: Record<number, string>; preview?: string; seed?: number },
) {
  const query = new URLSearchParams({
    seed: String(options.seed ?? 1),
    board: fixtureBoard(options.rows),
    preview: options.preview ?? 'bbb',
  });
  await page.goto(`/?${query.toString()}`);
}

/** A board field by 0-based row and column. */
export const field = (page: Page, row: number, col: number) =>
  page.locator(`button[data-row="${row}"][data-col="${col}"]`);

export const balls = (page: Page) => page.locator('button[data-ball="true"]');

export const status = (page: Page) => page.getByRole('status');
