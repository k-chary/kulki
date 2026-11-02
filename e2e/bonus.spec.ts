import { expect, test } from '@playwright/test';
import {
  field,
  gameOverDialog,
  nearlyFullRows,
  openFixture,
  playToGameOver,
  scoreRows,
} from './helpers';

test.describe('bonus for long clears', () => {
  test('a clear of six shows the chip with the bonus line', async ({ page }) => {
    // Moving the ball from 2,3 to 0,3 joins five more: six balls, 70 points.
    await openFixture(page, { rows: { 0: 'rrr.rr', 2: '...r' }, bonus: true });
    await expect(page.getByText('Wyniki z premią · 6 kolorów')).toBeVisible();
    await field(page, 2, 3).click();
    await field(page, 0, 3).click();
    await expect(page.getByText('+70')).toBeVisible();
    await expect(page.getByText('6 kulek · premia +10')).toBeVisible();
  });

  test('the same clear without the bonus has no bonus line', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'rrr.rr', 2: '...r' } });
    await field(page, 2, 3).click();
    await field(page, 0, 3).click();
    await expect(page.getByText('+60')).toBeVisible();
    await expect(page.getByText(/premia/)).toHaveCount(0);
  });

  test('a finished bonus game lands in „Wyniki z premią”', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp', bonus: true, scores: [900] });
    await expect(page.getByText('Wyniki z premią · 6 kolorów')).toBeVisible();
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
    await playToGameOver(page);

    const over = gameOverDialog(page);
    await expect(over).toContainText('2. miejsce w najlepszych wynikach');
    await over.getByLabel('Twoje imię').fill('Ola');
    await over.getByRole('button', { name: 'Zapisz wynik' }).click();
    await expect(scoreRows(page, 'saved')).toContainText('Ola');
    await expect(scoreRows(page)).toHaveCount(2);

    // The list without the bonus is a different one and still empty.
    await page.getByRole('radio', { name: /^bez premii/i }).click();
    await expect(page.getByText('Brak wyników dla 6 kolorów.')).toBeVisible();
  });

  test('browsing the list without the bonus pins the game', async ({ page }) => {
    await openFixture(page, { rows: { 0: 'r' }, bonus: true });
    await page.getByRole('radio', { name: /^bez premii/i }).click();
    await expect(page.getByText('Najlepsze wyniki · 6 kolorów')).toBeVisible();
    const note = page.getByRole('button', { name: /^Ta gra:/ });
    await expect(note).toContainText('z premią');
    await note.click();
    await expect(page.getByText('Wyniki z premią · 6 kolorów')).toBeVisible();
    await expect(note).toHaveCount(0);
  });
});
