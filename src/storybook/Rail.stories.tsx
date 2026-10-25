import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { HighscoreList } from '../components/HighscoreList/HighscoreList';
import { NextBalls } from '../components/NextBalls/NextBalls';
import { ScorePanel } from '../components/ScorePanel/ScorePanel';
import { rowsWithLive, type HighscoreEntry } from '../highscores/ranking';
import { RailFrame } from './RailFrame';

const POINTS = [3870, 3420, 3110, 2890, 2760, 2540, 2310, 2200, 1980, 1870, 1760, 1650, 1530, 1410];
const scores: HighscoreEntry[] = POINTS.map((score, i) => ({
  name: i % 2 ? 'Ola' : 'Harry',
  score,
  date: new Date(2026, 9, 18 - i * 3, 20).toISOString(),
}));

/** The side rail as the game screen stacks it: Wynik, Następne, Nowa gra, Najlepsze wyniki. */
function Rail({ newGameDisabled }: { newGameDisabled: boolean }) {
  return (
    <RailFrame tall>
      <ScorePanel score={1240} cleared={124} />
      <NextBalls colors={['blue', 'yellow', 'purple']} />
      <Button variant="secondary" disabled={newGameDisabled}>
        Nowa gra
      </Button>
      <HighscoreList rows={rowsWithLive(scores, 1240)} />
    </RailFrame>
  );
}

const meta = {
  title: 'Rail/Assembled',
  component: Rail,
  args: { newGameDisabled: false },
} satisfies Meta<typeof Rail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** During an animation or a dialog. */
export const Locked: Story = { args: { newGameDisabled: true } };
