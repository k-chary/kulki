import { expect, test } from '@playwright/test';
import { balls, field, openFixture, status } from './helpers';

const scorePanel = (page: import('@playwright/test').Page) =>
  page.locator('section', { has: page.getByRole('heading', { name: 'Wynik', exact: true }) });

test.describe('moving a ball', () => {
  test('selects a ball, previews the path and moves it', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');

    await field(page, 0, 0).click();
    await expect(status(page)).toHaveText('Wybrana kulka: czerwona · kliknij puste pole');
    await expect(field(page, 0, 0)).toHaveAttribute('data-state', 'selected');

    await field(page, 2, 0).hover();
    await expect(field(page, 1, 0)).toHaveAttribute('data-state', 'path');
    await expect(field(page, 2, 0)).toHaveAttribute('data-state', 'target');

    await field(page, 2, 0).click();
    await expect(field(page, 2, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 3, kolumna 1');
    await expect(field(page, 0, 0)).toHaveAccessibleName('Puste pole, wiersz 1, kolumna 1');
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');
  });

  test('switches the selection and deselects with a second click', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'rg' } });
    await field(page, 0, 0).click();
    await field(page, 0, 1).click();
    await expect(status(page)).toHaveText('Wybrana kulka: zielona · kliknij puste pole');
    await field(page, 0, 1).click();
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');
  });

  test('a move that clears nothing adds the three preview balls', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await expect(balls(page)).toHaveCount(4);
    await expect(page.getByRole('button', { name: /^Kulka niebieska/ })).toHaveCount(3);
  });

  test('a target without a way shows the message and keeps the selection', async ({ page }) => {
    await openFixture(page, { rows: { 7: '........g', 8: '.......gr' } });
    await field(page, 8, 8).click();
    await field(page, 4, 4).hover();
    await expect(field(page, 4, 4)).toHaveAttribute('data-state', 'blocked');
    await field(page, 4, 4).click();

    await expect(status(page)).toHaveText('Tam nie ma przejścia');
    await expect(balls(page)).toHaveCount(3);
    // The message goes away after 2.2 s and the selection is still there.
    await expect(status(page)).toHaveText('Wybrana kulka: czerwona · kliknij puste pole', {
      timeout: 5000,
    });
    await expect(scorePanel(page)).toContainText('0 kulek zbitych');
  });
});

test('a move completing a line clears it and adds 50 points', async ({ page }) => {
  await openFixture(page, { rows: { 0: 'rrrr....', 1: '........r' }, preview: 'bbb' });
  await field(page, 1, 8).click();
  await field(page, 0, 4).click();

  await expect(balls(page)).toHaveCount(0);
  await expect(scorePanel(page)).toContainText('50');
  await expect(scorePanel(page)).toContainText('5 kulek zbitych');
});

test.describe('„Nowa gra”', () => {
  test('starts at once before the first move', async ({ page }) => {
    await page.goto('/?seed=3');
    await expect(balls(page)).toHaveCount(5);
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(balls(page)).toHaveCount(5);
  });

  test('asks after a move: Anuluj keeps the game, Nowa gra resets it', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await expect(balls(page)).toHaveCount(4);

    await page.getByRole('button', { name: 'Nowa gra' }).click();
    const dialog = page.getByRole('dialog', { name: 'Zacząć nową grę?' });
    await expect(dialog).toContainText('Obecna gra (0 pkt) zostanie utracona.');
    await expect(dialog.getByRole('button', { name: 'Anuluj' })).toBeFocused();

    await dialog.getByRole('button', { name: 'Anuluj' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(balls(page)).toHaveCount(4);
    await expect(field(page, 2, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 3, kolumna 1');

    await page.getByRole('button', { name: 'Nowa gra' }).click();
    await dialog.getByRole('button', { name: 'Nowa gra' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(balls(page)).toHaveCount(5);
    await expect(scorePanel(page)).toContainText('0 kulek zbitych');
  });
});

test('the same seed gives the same start', async ({ page }) => {
  await page.goto('/?seed=11');
  const first = await balls(page).evaluateAll((nodes) => nodes.map((n) => n.ariaLabel));
  await page.goto('/?seed=11');
  const second = await balls(page).evaluateAll((nodes) => nodes.map((n) => n.ariaLabel));
  expect(second).toEqual(first);
});

test.describe('save and resume', () => {
  test('a reload after a move restores board, score and preview with the status message', async ({
    page,
  }) => {
    await openFixture(page, { rows: { 0: 'rrrr' }, preview: 'ggg' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await expect(balls(page)).toHaveCount(7);

    await page.reload();
    await expect(balls(page)).toHaveCount(7);
    await expect(field(page, 2, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 3, kolumna 1');
    await expect(page.getByRole('button', { name: /^Kulka zielona/ })).toHaveCount(3);
    await expect(status(page)).toHaveText('Wczytano zapisaną grę');
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać', { timeout: 5000 });
  });

  test('a new game after a confirmed „Nowa gra” is not resumed', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb' });
    await field(page, 0, 0).click();
    await field(page, 2, 0).click();
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Nowa gra/ })
      .click();
    await expect(balls(page)).toHaveCount(5);

    await page.reload();
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');
  });

  test('a fresh install starts a new game with five balls', async ({ page }) => {
    await page.goto('/');
    await expect(balls(page)).toHaveCount(5);
    await expect(status(page)).toHaveText('Kliknij kulkę, aby ją wybrać');
  });
});
