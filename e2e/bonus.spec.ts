import { expect, test } from '@playwright/test';
import { gameOverDialog, nearlyFullRows, openFixture, playToGameOver, scoreRows } from './helpers';

test.describe('bonus for long clears', () => {
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
});
