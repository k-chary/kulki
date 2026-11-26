import { expect, test } from '@playwright/test';
import { balls, field, openFixture, status } from './helpers';

const scorePanel = (page: import('@playwright/test').Page) =>
  page.locator('section', { has: page.getByRole('heading', { name: 'Wynik', exact: true }) });

test.describe('input lock', () => {
  test('another ball can be selected during a move but not moved until it ends', async ({
    page,
  }) => {
    await openFixture(page, { rows: { 0: 'r.......y', 4: '..g......' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 8, 0).click();
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(1);

    // Pickable balls keep the pointer cursor, the rest of the locked board does not.
    await expect(field(page, 0, 8)).toHaveCSS('cursor', 'pointer');
    await expect(field(page, 2, 4)).toHaveCSS('cursor', 'default');
    // The yellow ball takes the selection at once, with the board still locked.
    await field(page, 0, 8).click({ force: true });
    await expect(field(page, 0, 8)).toHaveAttribute('data-state', 'selected');
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(1);
    // A target click is dropped.
    await field(page, 2, 4).click({ force: true });
    await expect(field(page, 2, 4)).toHaveAttribute('data-ball', 'false');

    // After the animation the selection stands and the ball can move.
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await expect(field(page, 0, 8)).toHaveAttribute('data-state', 'selected');
    await field(page, 2, 4).click();
    await expect(field(page, 2, 4)).toHaveAttribute('data-ball', 'true');
  });

  test('the shake of a missed move does not lock the board', async ({ page }) => {
    await openFixture(page, { rows: { 7: '........g', 8: '.......gr' } });
    await field(page, 8, 8).click();
    await field(page, 4, 4).click();
    await expect(status(page)).toHaveText('Tam nie ma przejścia');
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await field(page, 7, 8).click();
    await expect(status(page)).toHaveText('');
  });
});

test.describe('full motion', () => {
  test.use({ reducedMotion: 'no-preference' });
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`turn scenarios, motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });

    test('a move completing a line clears it, scores 50 and spawns nothing', async ({ page }) => {
      await openFixture(page, { rows: { 0: 'rrrr....', 1: '........r' }, preview: 'bbb' });
      await field(page, 1, 8).click();
      await field(page, 0, 4).click();
      await expect(balls(page)).toHaveCount(0);
      await expect(scorePanel(page)).toContainText('50');
      await expect(scorePanel(page)).toContainText('5 kulek zbitych');
      await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    });
  });
}

test.describe('new game and resume', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a new game pops its five balls in, then takes input', async ({ page }) => {
    await page.goto('/?seed=3');
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(1);
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await expect(balls(page)).toHaveCount(5);
  });
});
