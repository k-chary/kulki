import { expect, test } from '@playwright/test';
import {
  gameOverDialog,
  nearlyFullRows,
  openFixture,
  playToGameOver,
  scoreRows,
  field,
} from './helpers';

test.describe('game over', () => {
  test('a full board asks for a name, saves it and rings the row until the next game', async ({
    page,
  }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);

    const dialog = gameOverDialog(page);
    await expect(dialog).toContainText('0pkt');
    await expect(dialog).toContainText('1. miejsce w najlepszych wynikach');
    await expect(dialog).toContainText('Nowy rekord');
    await expect(dialog.getByLabel('Twoje imię')).toBeFocused();
    // The rail stays readable and „Nowa gra” waits for the dialog.
    await expect(page.getByRole('button', { name: 'Nowa gra' }).first()).toBeDisabled();

    await dialog.getByLabel('Twoje imię').fill('Ola');
    await dialog.getByRole('button', { name: 'Zapisz wynik' }).click();

    await expect(dialog).toContainText('Zapisano jako Ola · 1. miejsce');
    await expect(scoreRows(page, 'saved')).toHaveCount(1);
    await expect(scoreRows(page, 'saved')).toContainText('Ola');
    await expect(scoreRows(page, 'current')).toHaveCount(0);

    // „Nowa gra” starts at once and the ring goes away.
    await dialog.getByRole('button', { name: 'Nowa gra' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(scoreRows(page, 'saved')).toHaveCount(0);
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
  });

  test('an empty name is saved as „Gracz”', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);

    const dialog = gameOverDialog(page);
    await dialog.getByLabel('Twoje imię').fill('');
    await page.keyboard.press('Enter');
    await expect(dialog).toContainText('Zapisano jako Gracz · 1. miejsce');
    await expect(scoreRows(page, 'saved')).toContainText('Gracz');
  });

  test('the name is cut to 20 characters', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);

    const dialog = gameOverDialog(page);
    await dialog.getByLabel('Twoje imię').fill('Abcdefghijklmnopqrstuvwxyz');
    await dialog.getByRole('button', { name: 'Zapisz wynik' }).click();
    await expect(dialog).toContainText('Zapisano jako Abcdefghijklmnopqrst · 1. miejsce');
  });

  test('a score outside a full top 30 shows the points missing and saves nothing', async ({
    page,
  }) => {
    await openFixture(page, {
      rows: nearlyFullRows(),
      preview: 'ppp',
      scores: Array<number>(30).fill(100),
    });
    await playToGameOver(page);

    const dialog = gameOverDialog(page);
    await expect(dialog).toContainText('Ten wynik nie mieści się w najlepszej trzydziestce.');
    await expect(dialog).toContainText('Do 30. miejsca brakuje 101 pkt.');
    await expect(dialog.getByLabel('Twoje imię')).toHaveCount(0);
    await expect(scoreRows(page)).toHaveCount(30);
    await expect(scoreRows(page, 'current')).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Nowa gra' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(scoreRows(page, 'stored')).toHaveCount(30);
  });

  test('the board takes no clicks after the game ended', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);
    await expect(gameOverDialog(page)).toBeVisible();
    await expect(field(page, 8, 8)).toBeDisabled();
  });
});

test.describe('highscore list', () => {
  test('„Ta gra · teraz” climbs as the score grows', async ({ page }) => {
    await openFixture(page, {
      rows: { 0: 'rrrr....', 1: '........r' },
      preview: 'bbb',
      scores: [60, 40],
    });

    await expect(scoreRows(page)).toHaveCount(3);
    await expect(scoreRows(page).nth(2)).toHaveAttribute('data-kind', 'current');
    await expect(scoreRows(page, 'current')).toContainText('Ta gra');
    await expect(scoreRows(page, 'current')).toContainText('teraz');

    await field(page, 1, 8).click();
    await field(page, 0, 4).click();

    // 50 points beat the 40 and not the 60: second place.
    await expect(scoreRows(page).nth(1)).toHaveAttribute('data-kind', 'current');
    await expect(scoreRows(page, 'current')).toContainText('50');
  });

  test('a score outside a full list shows no live row', async ({ page }) => {
    const scores = Array<number>(30).fill(100).join(',');
    await page.goto(`/?seed=1&scores=${scores}`);
    await expect(scoreRows(page, 'stored')).toHaveCount(30);
    await expect(scoreRows(page, 'current')).toHaveCount(0);
  });
});
