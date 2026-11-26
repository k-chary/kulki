import { expect, test } from '@playwright/test';
import { balls, field, openFixture, status } from './helpers';

test('undo takes back a move: board and preview return and the score drops by the cost', async ({
  page,
}) => {
  await openFixture(page, { rows: { 0: 'r' }, preview: 'bbb', score: 100 });
  const undo = page.getByRole('button', { name: /^Cofnij ostatni ruch/ });
  await expect(undo).toBeDisabled();

  await field(page, 0, 0).click();
  await field(page, 2, 0).click();
  await expect(balls(page)).toHaveCount(4);
  await expect(undo).toBeEnabled();

  await undo.click();
  await expect(balls(page)).toHaveCount(1);
  await expect(field(page, 0, 0)).toHaveAccessibleName('Kulka czerwona, wiersz 1, kolumna 1');
  await expect(status(page)).toHaveText('Cofnięto ruch (−20 pkt)');
  await expect(page.getByText('80', { exact: true }).first()).toBeVisible();
  await expect(undo).toBeDisabled();
});
