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

const newGameDialog = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: 'Nowa gra' });
const heading = (page: import('@playwright/test').Page, count: number) =>
  page.getByText(`Najlepsze wyniki · ${count} kolorów`);

test.describe('color count', () => {
  test('starts a 9-color game through the dialog and plays a move', async ({ page }) => {
    await page.goto('/?seed=5');
    await expect(heading(page, 6)).toBeVisible();

    await page.getByRole('button', { name: 'Nowa gra' }).click();
    const dialog = newGameDialog(page);
    await dialog.getByRole('radio', { name: '9 kolorów' }).click();
    await dialog.getByRole('button', { name: 'Zacznij' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(heading(page, 9)).toBeVisible();
    await expect(balls(page)).toHaveCount(5);

    // A move on the new game: pick a ball and send it to an empty field.
    const ball = balls(page).first();
    const row = await ball.getAttribute('data-row');
    const col = await ball.getAttribute('data-col');
    await ball.click();
    const target = field(page, Number(row) === 8 ? 0 : 8, Number(col) === 8 ? 7 : 8);
    await target.click();
    await expect(page.getByRole('button', { name: 'Nowa gra' })).toBeEnabled();

    // The count is part of the save: a reload resumes the 9-color game.
    await page.reload();
    await expect(heading(page, 9)).toBeVisible();
  });

  test('the last count played is used on the next launch without a save', async ({ page }) => {
    await page.goto('/?seed=5');
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    await newGameDialog(page).getByRole('radio', { name: '7 kolorów' }).click();
    await newGameDialog(page).getByRole('button', { name: 'Zacznij' }).click();
    await expect(heading(page, 7)).toBeVisible();

    await page.reload();
    await expect(heading(page, 7)).toBeVisible();
  });

  test('Anuluj keeps the game and its count', async ({ page }) => {
    await page.goto('/?seed=5');
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    await newGameDialog(page).getByRole('radio', { name: '9 kolorów' }).click();
    await newGameDialog(page).getByRole('button', { name: 'Anuluj' }).click();
    await expect(newGameDialog(page)).toHaveCount(0);
    await expect(heading(page, 6)).toBeVisible();
    await expect(balls(page)).toHaveCount(5);
  });

  test('a finished 9-color game goes into the 9-color list only', async ({ page }) => {
    await openFixture(page, {
      rows: nearlyFullRows(),
      preview: 'ppp',
      colors: 9,
      scores: [900],
    });
    await expect(heading(page, 9)).toBeVisible();
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
    await playToGameOver(page);

    const over = gameOverDialog(page);
    await expect(over).toContainText('2. miejsce w najlepszych wynikach');
    await over.getByLabel('Twoje imię').fill('Ola');
    await over.getByRole('button', { name: 'Zapisz wynik' }).click();
    await expect(scoreRows(page, 'saved')).toContainText('Ola');
    await expect(scoreRows(page)).toHaveCount(2);

    // The 6-color list is a different one and still empty.
    await over.getByRole('button', { name: 'Nowa gra' }).click();
    await newGameDialog(page).getByRole('radio', { name: '6 kolorów' }).click();
    await newGameDialog(page).getByRole('button', { name: 'Zacznij' }).click();
    await expect(heading(page, 6)).toBeVisible();
    await expect(scoreRows(page, 'stored')).toHaveCount(0);
  });
});
