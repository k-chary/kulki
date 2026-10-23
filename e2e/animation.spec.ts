import { expect, test } from '@playwright/test';
import { balls, field, openFixture, status } from './helpers';

const scorePanel = (page: import('@playwright/test').Page) =>
  page.locator('section', { has: page.getByRole('heading', { name: 'Wynik', exact: true }) });

test.describe('input lock', () => {
  test('drops clicks during a move and releases the lock afterwards', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r.......y' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 8, 0).click();

    // Locked: the board takes no input, „Nowa gra” is disabled, the status line is empty.
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Nowa gra' })).toBeDisabled();
    await expect(status(page)).toHaveText('');
    await field(page, 0, 8).click({ force: true });
    await field(page, 0, 8).click({ force: true });

    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Nowa gra' })).toBeEnabled();
    // The dropped clicks selected nothing.
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');
    await expect(field(page, 8, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 9, kolumna 1');
    await expect(balls(page)).toHaveCount(5);
  });

  test('the shake of a missed move does not lock the board', async ({ page }) => {
    await openFixture(page, { rows: { 7: '........g', 8: '.......gr' } });
    await field(page, 8, 8).click();
    await field(page, 4, 4).click();
    await expect(status(page)).toHaveText('Tam nie ma przejścia');
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await field(page, 7, 8).click();
    await expect(status(page)).toHaveText('Wybrana kulka: zielona · kliknij puste pole');
  });
});

test.describe('full motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the ball slides on its own layer before it lands', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 8, 0).click();
    // Eight squares at 40 ms: the sliding ball is a div over the board mid-move.
    await expect(page.locator('div[data-row][data-col]')).toHaveCount(1);
    await expect(page.locator('div[data-row][data-col]')).toHaveCount(0);
    await expect(field(page, 8, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 9, kolumna 1');
  });
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`turn scenarios, motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });

    test('a move that clears nothing adds the preview balls', async ({ page }) => {
      await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
      await field(page, 0, 0).click();
      await field(page, 2, 0).click();
      await expect(balls(page)).toHaveCount(4);
      await expect(page.getByRole('button', { name: /^Kulka niebieska/ })).toHaveCount(3);
      await expect(field(page, 2, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 3, kolumna 1');
    });

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

  test('a resumed game appears at once, without animation', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
    await page.reload();
    await expect(status(page)).toHaveText('Wczytano zapisaną grę');
    await expect(balls(page)).toHaveCount(4);
    await expect(page.locator('div[data-locked="true"]')).toHaveCount(0);
  });
});
