import { expect, test } from '@playwright/test';

test.describe('„Opcje”', () => {
  test('a picked ball theme survives a reload', async ({ page }) => {
    await page.goto('/?seed=5');
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-ball-theme', 'classic');

    await page.getByRole('button', { name: 'Opcje' }).click();
    const dialog = page.getByRole('dialog', { name: 'Opcje' });
    await dialog.getByRole('tab', { name: 'Wygląd' }).click();
    await dialog.getByRole('radio', { name: /Cukierkowe/ }).click();
    await expect(root).toHaveAttribute('data-ball-theme', 'candy');
    await dialog.getByRole('button', { name: 'Gotowe' }).click();
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(root).toHaveAttribute('data-ball-theme', 'candy');
  });

  test('„Kotki” survive a reload', async ({ page }) => {
    await page.goto('/?seed=5');
    const root = page.locator('html');

    await page.getByRole('button', { name: 'Opcje' }).click();
    const dialog = page.getByRole('dialog', { name: 'Opcje' });
    await dialog.getByRole('tab', { name: 'Wygląd' }).click();
    await dialog.getByRole('radio', { name: /Kotki/ }).click();
    await expect(root).toHaveAttribute('data-ball-theme', 'cats');
    await dialog.getByRole('button', { name: 'Gotowe' }).click();
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(root).toHaveAttribute('data-ball-theme', 'cats');
  });
});

test.describe('„Opcje” · „Gra”', () => {
  test('sets the next scoring mid-game without touching the current one', async ({ page }) => {
    await page.goto('/?seed=5');
    await expect(page.getByText('Najlepsze wyniki · 6 kolorów')).toBeVisible();
    const balls = page.locator('button[data-ball="true"]');
    const before = await balls.count();

    await page.getByRole('button', { name: 'Opcje' }).click();
    const options = page.getByRole('dialog', { name: 'Opcje' });
    await expect(options.getByRole('tab', { name: 'Gra' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(options.getByRole('radio', { name: '8 kolorów' })).toHaveCount(0);
    await options.getByRole('radio', { name: /Z premią/ }).click();
    await options.getByRole('button', { name: 'Gotowe' }).click();
    await expect(options).toHaveCount(0);

    await expect(page.getByText('Najlepsze wyniki · 6 kolorów')).toBeVisible();
    await expect(balls).toHaveCount(before);

    await page.getByRole('button', { name: 'Nowa gra' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nowa gra' });
    await expect(dialog.getByRole('region', { name: 'Ustawienia gry' })).toContainText('Z premią');
    await dialog.getByRole('button', { name: 'Zacznij' }).click();
    await expect(page.getByText('Wyniki z premią · 6 kolorów')).toBeVisible();
  });

  test('„Nowa gra” links to it and comes back with the picked count', async ({ page }) => {
    await page.goto('/?seed=5');
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    let dialog = page.getByRole('dialog', { name: 'Nowa gra' });
    await dialog.getByRole('radio', { name: '8 kolorów' }).click();
    await dialog.getByRole('button', { name: 'Zmień w Opcjach' }).click();

    const options = page.getByRole('dialog', { name: 'Opcje' });
    await options.getByRole('radio', { name: /Z premią/ }).click();
    await options.getByRole('button', { name: 'Gotowe' }).click();

    dialog = page.getByRole('dialog', { name: 'Nowa gra' });
    await expect(dialog.getByRole('radio', { name: '8 kolorów' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(dialog.getByRole('region', { name: 'Ustawienia gry' })).toContainText('Z premią');
    await dialog.getByRole('button', { name: 'Zacznij' }).click();
    await expect(page.getByText('Wyniki z premią · 8 kolorów')).toBeVisible();
  });

  test('survives a reload', async ({ page }) => {
    await page.goto('/?seed=5');
    await page.getByRole('button', { name: 'Opcje' }).click();
    const options = page.getByRole('dialog', { name: 'Opcje' });
    await options.getByRole('radio', { name: /Z premią/ }).click();
    await options.getByRole('button', { name: 'Gotowe' }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Nowa gra' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nowa gra' });
    await expect(dialog.getByRole('region', { name: 'Ustawienia gry' })).toContainText('Z premią');
  });
});
