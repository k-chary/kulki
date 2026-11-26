import { expect, test } from '@playwright/test';
import { gameOverDialog, nearlyFullRows, openFixture, playToGameOver, scoreRows } from './helpers';

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

    // „Nowa gra” opens the new-game dialog; „Zacznij” starts and the ring goes away.
    await dialog.getByRole('button', { name: 'Nowa gra' }).click();
    await expect(dialog).toHaveCount(0);
    await page
      .getByRole('dialog', { name: 'Nowa gra' })
      .getByRole('button', { name: 'Zacznij' })
      .click();
    await expect(scoreRows(page, 'saved')).toHaveCount(0);
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
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
    await page
      .getByRole('dialog', { name: 'Nowa gra' })
      .getByRole('button', { name: 'Zacznij' })
      .click();
    await expect(scoreRows(page, 'stored')).toHaveCount(30);
  });

  test('closing the window with the name dialog open still saves the score', async ({ page }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);
    await expect(gameOverDialog(page)).toBeVisible();

    // A reload leaves the page like closing the window does; the web build keeps its storage.
    await page.goto('/?seed=1');
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
    await expect(scoreRows(page, 'stored')).toContainText('Gracz');
  });

  test('the score is stored when the game ends and „Zapisz wynik” only renames it', async ({
    page,
  }) => {
    await openFixture(page, { rows: nearlyFullRows(), preview: 'ppp' });
    await playToGameOver(page);
    const dialog = gameOverDialog(page);
    await dialog.getByLabel('Twoje imię').fill('Ola');
    await dialog.getByRole('button', { name: 'Zapisz wynik' }).click();
    await expect(dialog).toContainText('Zapisano jako Ola');

    await page.goto('/?seed=1');
    await expect(scoreRows(page, 'stored')).toHaveCount(1);
    await expect(scoreRows(page, 'stored')).toContainText('Ola');
  });
});

test.describe('highscore list', () => {});
