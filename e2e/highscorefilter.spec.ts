import { expect, test } from '@playwright/test';
import { balls } from './helpers';

test.describe('highscores per color count', () => {
  test('browses another count during a game and returns through the pinned note', async ({
    page,
  }) => {
    await page.goto('/?seed=5');
    await expect(page.getByText('Najlepsze wyniki · 6 kolorów')).toBeVisible();
    await expect(balls(page)).toHaveCount(5);

    await page.getByRole('radio', { name: '8 kolorów' }).click();
    await expect(page.getByText('Najlepsze wyniki · 8 kolorów')).toBeVisible();
    await expect(page.getByText('Brak wyników dla 8 kolorów.')).toBeVisible();
    // The game itself is untouched.
    await expect(balls(page)).toHaveCount(5);

    await page.getByRole('button', { name: /^Ta gra:/ }).click();
    await expect(page.getByText('Najlepsze wyniki · 6 kolorów')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ta gra:/ })).toHaveCount(0);
  });
});
