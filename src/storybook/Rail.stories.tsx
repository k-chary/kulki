import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { ColorCountPicker } from '../components/ColorCountPicker/ColorCountPicker';
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

/**
 * The side rail as the game screen stacks it: Wynik, Następne, Kolory, Nowa gra,
 * Najlepsze wyniki (the list for the game's color count).
 */
function Rail({
  newGameDisabled,
  colorCount,
  short,
}: {
  newGameDisabled: boolean;
  colorCount: number;
  short?: boolean;
}) {
  return (
    <RailFrame tall={!short} minimum={short}>
      <ScorePanel score={1240} cleared={124} />
      <NextBalls colors={['blue', 'yellow', 'purple']} />
      <ColorCountPicker value={colorCount} disabled={newGameDisabled} />
      <Button variant="secondary" disabled={newGameDisabled}>
        Nowa gra
      </Button>
      <HighscoreList rows={rowsWithLive(scores, 1240)} colorCount={colorCount} />
    </RailFrame>
  );
}

const meta = {
  title: 'Rail/Assembled',
  component: Rail,
  args: { newGameDisabled: false, colorCount: 6 },
} satisfies Meta<typeof Rail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** During an animation or a dialog. */
export const Locked: Story = { args: { newGameDisabled: true } };

/** At the smallest window (496 px board) the list still keeps several rows. */
export const SmallestWindow: Story = { args: { short: true } };

export const NineColors: Story = { args: { colorCount: 9 } };
