import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { HighscoreList } from '../components/HighscoreList/HighscoreList';
import { NextBalls } from '../components/NextBalls/NextBalls';
import { ScorePanel } from '../components/ScorePanel/ScorePanel';
import { placeFor, rowsWithLive, type HighscoreEntry } from '../highscores/ranking';
import { RailFrame } from './RailFrame';

const POINTS = [3870, 3420, 3110, 2890, 2760, 2540, 2310, 2200, 1980, 1870, 1760, 1650, 1530, 1410];
const scores: HighscoreEntry[] = POINTS.map((score, i) => ({
  name: i % 2 ? 'Ola' : 'Harry',
  score,
  date: new Date(2026, 9, 18 - i * 3, 20).toISOString(),
  colorCount: 6,
}));

const sevenColors: HighscoreEntry[] = scores.map((entry) => ({
  ...entry,
  score: Math.round(entry.score / 2 / 10) * 10,
  colorCount: 7,
}));

/** The side rail as the game screen stacks it: Wynik, Następne, Nowa gra, Najlepsze wyniki. */
function Rail({ newGameDisabled, browsing }: { newGameDisabled: boolean; browsing?: number }) {
  const [shown, setShown] = useState(browsing ?? 6);
  const list = shown === 6 ? scores : sevenColors.slice(0, shown === 7 ? 6 : 0);
  return (
    <RailFrame tall>
      <ScorePanel score={1240} cleared={124} />
      <NextBalls colors={['blue', 'yellow', 'purple']} />
      <Button variant="secondary" disabled={newGameDisabled}>
        Nowa gra
      </Button>
      <HighscoreList
        rows={
          shown === 6
            ? rowsWithLive(list, 1240)
            : list.map((entry, i) => ({ kind: 'stored', place: i + 1, entry }))
        }
        colorCount={shown}
        gameColorCount={6}
        onColorCountChange={setShown}
        current={{ place: placeFor(1240, scores), score: 1240 }}
      />
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

/** Browsing the 7-color list in a 6-color game; the game's place is pinned at the foot. */
export const BrowsingOtherCount: Story = { args: { browsing: 7 } };
