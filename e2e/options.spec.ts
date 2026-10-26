import { expect, test } from '@playwright/test';

test.describe('„Opcje”', () => {
  test('a picked ball theme survives a reload', async ({ page }) => {
    await page.goto('/?seed=5');
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-ball-theme', 'classic');

    await page.getByRole('button', { name: 'Opcje' }).click();
    const dialog = page.getByRole('dialog', { name: 'Opcje' });
    await dialog.getByRole('radio', { name: /Cukierkowe/ }).click();
    await expect(root).toHaveAttribute('data-ball-theme', 'candy');
    await dialog.getByRole('button', { name: 'Gotowe' }).click();
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(root).toHaveAttribute('data-ball-theme', 'candy');
  });
});
