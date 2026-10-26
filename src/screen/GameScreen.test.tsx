// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type GameState, createRng, newGame } from '../rules';
import { parseBoard } from '../rules/testing';
import { MemoryStorage } from '../storage/MemoryStorage';
import { GameScreen } from './GameScreen';

beforeAll(() => {
  // jsdom does not scroll; the list scrolls its live row into view.
  Element.prototype.scrollIntoView = () => undefined;
  // Instant animations: the tokens come from tokens.css, which jsdom does not load.
  for (const token of ['step', 'clear', 'spawn', 'spawn-stagger', 'score', 'shake', 'status']) {
    document.documentElement.style.setProperty(`--dur-${token}`, '0ms');
  }
});
afterEach(cleanup);

const BOARD = parseBoard(['r........', ...Array<string>(8).fill('.........')].join('\n'));

function fixture(colorCount: number): GameState {
  return {
    board: BOARD,
    preview: ['blue', 'blue', 'blue'],
    score: 0,
    colorCount,
    cleared: 0,
    gameOver: false,
  };
}

function setup(colorCount = 6) {
  const storage = new MemoryStorage<GameState>();
  render(<GameScreen storage={storage} rng={createRng(4)} game={fixture(colorCount)} />);
  return { storage };
}

const newGameButton = () => screen.getByRole('button', { name: 'Nowa gra' });
const field = (row: number, col: number) => {
  const element = document.querySelector<HTMLButtonElement>(
    `button[data-row="${row}"][data-col="${col}"]`,
  );
  if (!element) throw new Error(`No field ${row},${col}`);
  return element;
};
const balls = () => document.querySelectorAll('button[data-ball="true"]');

async function playOneMove() {
  await userEvent.click(field(0, 0));
  await userEvent.click(field(2, 0));
  // The turn spawns three balls and unlocks the rail again.
  await waitFor(() => expect(balls()).toHaveLength(4));
  await waitFor(() => expect((newGameButton() as HTMLButtonElement).disabled).toBe(false));
}

describe('„Nowa gra” dialog', () => {
  it("opens on the game's count without a warning before the first move", async () => {
    setup(8);
    await userEvent.click(newGameButton());
    const dialog = screen.getByRole('dialog', { name: 'Nowa gra' });
    expect(
      within(dialog).getByRole('radio', { name: '8 kolorów' }).getAttribute('aria-checked'),
    ).toBe('true');
    expect(within(dialog).queryByText(/zostanie utracona/)).toBeNull();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Zacznij' }));
    expect((newGameButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('„Zacznij” starts a game with the chosen count and remembers it', async () => {
    const { storage } = setup(6);
    expect(await screen.findByText('Najlepsze wyniki · 6 kolorów')).toBeTruthy();
    await userEvent.click(newGameButton());
    await userEvent.click(screen.getByRole('radio', { name: '9 kolorów' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));

    expect(screen.queryByRole('dialog', { name: 'Nowa gra' })).toBeNull();
    expect(await screen.findByText('Najlepsze wyniki · 9 kolorów')).toBeTruthy();
    expect(await storage.getLastColorCount()).toBe(9);
    await userEvent.click(newGameButton());
    expect(screen.getByRole('radio', { name: '9 kolorów' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('„Anuluj” keeps the game before the first move', async () => {
    const { storage } = setup(6);
    await userEvent.click(newGameButton());
    await userEvent.click(screen.getByRole('radio', { name: '9 kolorów' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(balls()).toHaveLength(1);
    expect(screen.getByText('Najlepsze wyniki · 6 kolorów')).toBeTruthy();
    expect(await storage.getLastColorCount()).toBeNull();
  });

  it('warns after a move and Esc keeps the game and its count', async () => {
    setup(7);
    await playOneMove();
    await userEvent.click(newGameButton());
    const dialog = screen.getByRole('dialog', { name: 'Nowa gra' });
    expect(within(dialog).getByText('Obecna gra (0 pkt) zostanie utracona.')).toBeTruthy();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Anuluj' }));

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(balls()).toHaveLength(4);
    expect(screen.getByText('Najlepsze wyniki · 7 kolorów')).toBeTruthy();
  });

  it('„Zacznij” after a move replaces the game', async () => {
    setup(6);
    await playOneMove();
    await userEvent.click(newGameButton());
    await userEvent.click(screen.getByRole('radio', { name: '5 kolorów' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(balls()).toHaveLength(5));
    expect(screen.getByText('Najlepsze wyniki · 5 kolorów')).toBeTruthy();
  });
});

describe('highscore list', () => {
  it("shows the list of the game's own color count", async () => {
    const storage = new MemoryStorage<GameState>();
    const date = '2026-01-15T12:00:00.000Z';
    await storage.insertHighscore({ name: 'Szóstka', score: 300, date, colorCount: 6 });
    await storage.insertHighscore({ name: 'Dziewiątka', score: 700, date, colorCount: 9 });
    render(<GameScreen storage={storage} rng={createRng(4)} game={newGame(createRng(4), 9)} />);

    expect(await screen.findByText('Dziewiątka')).toBeTruthy();
    expect(screen.queryByText('Szóstka')).toBeNull();
    expect(screen.getByText('Najlepsze wyniki · 9 kolorów')).toBeTruthy();
  });
});

describe('„Opcje”', () => {
  const optionsButton = () => screen.getByRole('button', { name: 'Opcje' });

  it('shares a row with „Nowa gra”', () => {
    setup();
    expect(optionsButton().parentElement).toBe(newGameButton().parentElement);
  });

  it('opens over the board and closes with „Gotowe”, Esc and a scrim click, returning focus', async () => {
    setup();
    for (const close of ['done', 'escape', 'scrim']) {
      await userEvent.click(optionsButton());
      const dialog = screen.getByRole('dialog', { name: 'Opcje' });
      if (close === 'done')
        await userEvent.click(within(dialog).getByRole('button', { name: 'Gotowe' }));
      else if (close === 'escape') await userEvent.keyboard('{Escape}');
      else await userEvent.click(dialog.parentElement as HTMLElement);
      expect(screen.queryByRole('dialog', { name: 'Opcje' })).toBeNull();
      expect(document.activeElement).toBe(optionsButton());
    }
  });

  it('applies a picked theme at once, saves it and leaves the game alone', async () => {
    const { storage } = setup();
    expect(document.documentElement.dataset.ballTheme).toBe('classic');
    await userEvent.click(optionsButton());
    await userEvent.click(screen.getByRole('radio', { name: /Cukierkowe/ }));
    expect(document.documentElement.dataset.ballTheme).toBe('candy');
    await waitFor(async () => expect(await storage.getBallTheme()).toBe('candy'));
    await userEvent.click(screen.getByRole('button', { name: 'Gotowe' }));
    expect(balls()).toHaveLength(1);
  });

  it('starts from the saved theme', () => {
    const storage = new MemoryStorage<GameState>();
    render(<GameScreen storage={storage} rng={createRng(4)} game={fixture(6)} ballTheme="candy" />);
    expect(document.documentElement.dataset.ballTheme).toBe('candy');
  });

  it('is disabled with „Nowa gra”, during an animation and in a dialog', async () => {
    setup();
    await userEvent.click(newGameButton());
    expect((optionsButton() as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect((optionsButton() as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(optionsButton());
    expect((newGameButton() as HTMLButtonElement).disabled).toBe(true);
  });
});
