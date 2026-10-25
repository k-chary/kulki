import type { Meta, StoryObj } from '@storybook/react-vite';
import type { HighscoreEntry } from '../highscores/ranking';
import { type Color, type GameState, CELL_COUNT, createRng } from '../rules';
import { MemoryStorage } from '../storage/MemoryStorage';
import { GameScreen } from './GameScreen';

const meta = {
  title: 'Screen/GameScreen',
  component: GameScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GameScreen>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A new game with a seeded generator; playable, with turns animated (use the Motion switch for reduced motion). */
export const NewGame: Story = {
  args: { storage: new MemoryStorage(), rng: createRng(7) },
};

const COLORS: Color[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/** A full board without a line, as the game leaves it when it ends. */
const finished = (score: number): GameState => ({
  board: Array.from({ length: CELL_COUNT }, (_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    return COLORS[(row + 2 * col) % 6] as Color;
  }),
  preview: ['red', 'green', 'blue'],
  colorCount: 6,
  score,
  cleared: score / 10,
  gameOver: true,
});

const stored = (count: number): HighscoreEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    name: `Gracz ${i + 1}`,
    score: 1000 - i * 10,
    date: '2026-01-15T12:00:00.000Z',
    colorCount: 6,
  }));

function withScores(count: number) {
  const storage = new MemoryStorage<GameState>();
  for (const entry of stored(count)) void storage.insertHighscore(entry);
  return storage;
}

/** Game over with a score for the top 30: the name is asked for. */
export const GameOverNameEntry: Story = {
  args: { storage: new MemoryStorage(), rng: createRng(7), game: finished(430) },
};

/** Game over with a score below a full top 30: nothing to save. */
export const GameOverOutsideTop30: Story = {
  args: { storage: withScores(30), rng: createRng(7), game: finished(430) },
};
