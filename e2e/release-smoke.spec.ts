import { expect, test } from '@playwright/test';
import {
  balls,
  field,
  gameOverDialog,
  nearlyFullRows,
  openFixture,
  playToGameOver,
  scoreRows,
} from './helpers';

// The release gate: everything a player does, start to finish. Each step opens its own fixture
// board, since a clear or a full board cannot be reached by chance from a random start.
test.describe('release smoke', () => {
  test('launches with five balls and a preview', async ({ page }) => {
    await page.goto('/?seed=3');
    await expect(balls(page)).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Nowa gra' })).toBeEnabled();
  });

  test('moves that clear nothing add three balls each', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r', 4: 'g' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await expect(balls(page)).toHaveCount(5);
    await field(page, 4, 0).click();
    await field(page, 6, 0).click();
    await expect(balls(page)).toHaveCount(8);
  });

  test('a completed line clears and scores', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'rrrr....', 1: '........r' }, preview: 'bbb' });
    await field(page, 1, 8).click();
    await field(page, 0, 4).click();
    await expect(balls(page)).toHaveCount(0);
    await expect(
      page.locator('section', { has: page.getByRole('heading', { name: 'Wynik', exact: true }) }),
    ).toContainText('50');
  });

  test('a full board ends the game and the name is saved', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);
    const dialog = gameOverDialog(page);
    await dialog.getByLabel('Twoje imię').fill('Ola');
    await dialog.getByRole('button', { name: 'Zapisz wynik' }).click();
    await expect(dialog).toContainText('Zapisano jako Ola');
    await expect(scoreRows(page, 'saved')).toContainText('Ola');
  });
});
