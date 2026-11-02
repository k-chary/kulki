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
    bonus: false,
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
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Nowa gra' })).getByRole('radio', {
        name: '9 kolorów',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));

    expect(screen.queryByRole('dialog', { name: 'Nowa gra' })).toBeNull();
    expect(await screen.findByText('Najlepsze wyniki · 9 kolorów')).toBeTruthy();
    expect(await storage.getLastColorCount()).toBe(9);
    await userEvent.click(newGameButton());
    expect(
      within(screen.getByRole('dialog', { name: 'Nowa gra' }))
        .getByRole('radio', { name: '9 kolorów' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('„Anuluj” keeps the game before the first move', async () => {
    const { storage } = setup(6);
    await userEvent.click(newGameButton());
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Nowa gra' })).getByRole('radio', {
        name: '9 kolorów',
      }),
    );
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
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Nowa gra' })).getByRole('radio', {
        name: '5 kolorów',
      }),
    );
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
    await storage.insertHighscore({
      name: 'Szóstka',
      score: 300,
      date,
      colorCount: 6,
      bonus: false,
    });
    await storage.insertHighscore({
      name: 'Dziewiątka',
      score: 700,
      date,
      colorCount: 9,
      bonus: false,
    });
    render(<GameScreen storage={storage} rng={createRng(4)} game={newGame(createRng(4), 9)} />);

    expect(await screen.findByText('Dziewiątka')).toBeTruthy();
    expect(screen.queryByText('Szóstka')).toBeNull();
    expect(screen.getByText('Najlepsze wyniki · 9 kolorów')).toBeTruthy();
  });
});

describe('browsing other color counts', () => {
  const date = '2026-01-15T12:00:00.000Z';
  const radio = (name: string) =>
    within(screen.getByRole('radiogroup', { name: 'Pokaż wyniki dla' })).getByRole('radio', {
      name: new RegExp(`^${name}`),
    });
  const note = () => screen.getByRole('button', { name: /^Ta gra:/ });

  async function browsable(colorCount = 6) {
    const storage = new MemoryStorage<GameState>();
    await storage.insertHighscore({
      name: 'Szóstka',
      score: 300,
      date,
      colorCount: 6,
      bonus: false,
    });
    await storage.insertHighscore({
      name: 'Dziewiątka',
      score: 700,
      date,
      colorCount: 9,
      bonus: false,
    });
    render(<GameScreen storage={storage} rng={createRng(4)} game={fixture(colorCount)} />);
    await screen.findByText('Szóstka');
    return { storage };
  }

  it("shows another count's list with the game pinned, and the note switches back", async () => {
    await browsable();
    await userEvent.click(radio('9 kolorów'));

    expect(await screen.findByText('Dziewiątka')).toBeTruthy();
    expect(screen.queryByText('Szóstka')).toBeNull();
    expect(screen.queryByText('Ta gra')).toBeNull();
    expect(screen.getByText('Najlepsze wyniki · 9 kolorów')).toBeTruthy();
    expect(note().getAttribute('aria-label')).toContain('2. miejsce');

    await userEvent.click(note());
    expect(await screen.findByText('Szóstka')).toBeTruthy();
    expect(screen.queryByText('Dziewiątka')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ta gra:/ })).toBeNull();
  });

  it('says so when the chosen count has no scores', async () => {
    await browsable();
    await userEvent.click(radio('7 kolorów'));
    expect(await screen.findByText('Brak wyników dla 7 kolorów.')).toBeTruthy();
  });

  it('keeps the pinned note in step with the score', async () => {
    await browsable();
    await userEvent.click(radio('9 kolorów'));
    expect(note().getAttribute('aria-label')).toContain('0 pkt');
    await playOneMove();
    expect(screen.getByText('Dziewiątka')).toBeTruthy();
  });

  it('snaps back to the game when a new game starts', async () => {
    await browsable();
    await userEvent.click(radio('9 kolorów'));
    await screen.findByText('Dziewiątka');

    await userEvent.click(newGameButton());
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Nowa gra' })).getByRole('radio', {
        name: '6 kolorów',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));
    expect(await screen.findByText('Szóstka')).toBeTruthy();
    expect(screen.getByText('Najlepsze wyniki · 6 kolorów')).toBeTruthy();
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

describe('next balls on a nearly full board', () => {
  const rows = (free: number) => {
    const cells = Array<string>(81).fill('r');
    for (let i = 0; i < free; i++) cells[i] = '.';
    return parseBoard(
      Array.from({ length: 9 }, (_, r) => cells.slice(r * 9, r * 9 + 9).join('')).join('\n'),
    );
  };

  it.each([1, 2, 3, 5])('shows min(3, free) balls with %i free squares', (free) => {
    const game = { ...fixture(6), board: rows(free) };
    render(<GameScreen storage={new MemoryStorage<GameState>()} rng={createRng(4)} game={game} />);
    const label = screen.getByRole('img', { name: /niebieska|niebieski/i });
    expect(label.children).toHaveLength(Math.min(3, free));
  });
});

describe('bonus games', () => {
  const date = '2026-01-15T12:00:00.000Z';
  const scoring = (name: string) =>
    within(screen.getByRole('radiogroup', { name: 'Pokaż wyniki' })).getByRole('radio', {
      name: new RegExp(`^${name}`, 'i'),
    });
  const note = () => screen.getByRole('button', { name: /^Ta gra:/ });
  // Moving the ball from 2,3 to 0,3 joins five more into a clear of six.
  const SIX = parseBoard(
    ['rrr.rr...', '.........', '...r.....', ...Array<string>(6).fill('.........')].join('\n'),
  );
  const bonusGame = (): GameState => ({ ...fixture(6), board: SIX, bonus: true });
  const entry = (name: string, bonus: boolean, score: number) => ({
    name,
    score,
    date,
    colorCount: 6,
    bonus,
  });

  async function playSix() {
    await userEvent.click(field(2, 3));
    await userEvent.click(field(0, 3));
  }

  it('„Zacznij” starts a bonus game and remembers the scoring', async () => {
    const { storage } = setup();
    await userEvent.click(newGameButton());
    const dialog = screen.getByRole('dialog', { name: 'Nowa gra' });
    await userEvent.click(within(dialog).getByRole('radio', { name: /^Z premią/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Zacznij' }));

    expect(await screen.findByText('Wyniki z premią · 6 kolorów')).toBeTruthy();
    expect(await storage.getLastBonus()).toBe(true);
    await userEvent.click(newGameButton());
    expect(
      within(screen.getByRole('dialog', { name: 'Nowa gra' }))
        .getByRole('radio', { name: /^Z premią/ })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('opens „Nowa gra” on the remembered scoring', async () => {
    const storage = new MemoryStorage<GameState>();
    render(<GameScreen storage={storage} rng={createRng(4)} game={fixture(6)} nextBonus />);
    await userEvent.click(newGameButton());
    expect(
      within(screen.getByRole('dialog', { name: 'Nowa gra' }))
        .getByRole('radio', { name: /^Z premią/ })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('shows the bonus on the chip after a long clear', async () => {
    const storage = new MemoryStorage<GameState>();
    render(<GameScreen storage={storage} rng={createRng(4)} game={bonusGame()} />);
    await playSix();
    expect(await screen.findByText('+70')).toBeTruthy();
    expect(screen.getByText('6 kulek · premia +10')).toBeTruthy();
  });

  it('shows no bonus line for the same clear without the bonus', async () => {
    const storage = new MemoryStorage<GameState>();
    render(
      <GameScreen storage={storage} rng={createRng(4)} game={{ ...bonusGame(), bonus: false }} />,
    );
    await playSix();
    expect(await screen.findByText('+60')).toBeTruthy();
    expect(screen.queryByText(/premia/)).toBeNull();
  });

  it('switches the scoring filter, pins the game and switches back', async () => {
    const storage = new MemoryStorage<GameState>();
    await storage.insertHighscore(entry('Zwykły', false, 300));
    await storage.insertHighscore(entry('Premiowy', true, 500));
    render(<GameScreen storage={storage} rng={createRng(4)} game={bonusGame()} />);
    expect(await screen.findByText('Premiowy')).toBeTruthy();
    expect(screen.getByText('Wyniki z premią · 6 kolorów')).toBeTruthy();

    await userEvent.click(scoring('Bez premii'));
    expect(await screen.findByText('Zwykły')).toBeTruthy();
    expect(screen.queryByText('Premiowy')).toBeNull();
    expect(screen.getByText('Najlepsze wyniki · 6 kolorów')).toBeTruthy();
    expect(note().getAttribute('aria-label')).toContain('z premią');

    await userEvent.click(note());
    expect(await screen.findByText('Premiowy')).toBeTruthy();
    expect(screen.queryByText('Zwykły')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ta gra:/ })).toBeNull();
  });

  it('snaps both filters back when a game starts', async () => {
    const storage = new MemoryStorage<GameState>();
    await storage.insertHighscore(entry('Zwykły', false, 300));
    render(<GameScreen storage={storage} rng={createRng(4)} game={fixture(6)} />);
    await screen.findByText('Zwykły');
    await userEvent.click(scoring('Z premią'));
    await userEvent.click(screen.getByRole('radio', { name: /^9 kolorów/ }));
    expect(await screen.findByText('Wyniki z premią · 9 kolorów')).toBeTruthy();

    await userEvent.click(newGameButton());
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));
    expect(await screen.findByText('Najlepsze wyniki · 6 kolorów')).toBeTruthy();
    expect(await screen.findByText('Zwykły')).toBeTruthy();
  });

  it('stores a finished bonus game in its own list', async () => {
    const storage = new MemoryStorage<GameState>();
    const rows = Array<string>(9).fill('rygbpo' + 'ryg');
    // A full board but one square, so any spawn ends the game.
    const full = parseBoard(['.ygbporyg', 'bpoRYGbpo'.toLowerCase(), ...rows.slice(2)].join('\n'));
    const game: GameState = { ...fixture(6), board: full, bonus: true, score: 120 };
    render(<GameScreen storage={storage} rng={createRng(4)} game={game} />);
    await userEvent.click(field(1, 0));
    await userEvent.click(field(0, 0));
    await waitFor(async () => expect(await storage.listHighscores(6, true)).toHaveLength(1));
    expect(await storage.listHighscores(6, false)).toHaveLength(0);
  });
});
