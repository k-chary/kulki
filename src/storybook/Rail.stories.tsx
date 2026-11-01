import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button/Button';
import { HighscoreList } from '../components/HighscoreList/HighscoreList';
import { NextBalls } from '../components/NextBalls/NextBalls';
import { ScorePanel } from '../components/ScorePanel/ScorePanel';
import { placeFor, rowsWithLive, type HighscoreEntry } from '../highscores/ranking';
import { RailFrame } from './RailFrame';
import styles from './RailFrame.module.css';

const POINTS = [3870, 3420, 3110, 2890, 2760, 2540, 2310, 2200, 1980, 1870, 1760, 1650, 1530, 1410];
const scores: HighscoreEntry[] = POINTS.map((score, i) => ({
  name: i % 2 ? 'Ola' : 'Harry',
  score,
  date: new Date(2026, 9, 18 - i * 3, 20).toISOString(),
  colorCount: 6,
  bonus: false,
}));

const sevenColors: HighscoreEntry[] = scores.map((entry) => ({
  ...entry,
  score: Math.round(entry.score / 2 / 10) * 10,
  colorCount: 7,
}));

const bonusScores: HighscoreEntry[] = scores.map((entry) => ({
  ...entry,
  score: entry.score * 3,
}));

interface RailProps {
  newGameDisabled: boolean;
  browsing?: number;
  /** A game with the bonus for long clears, just after a 9-ball clear. */
  bonusGame?: boolean;
}

/** The side rail as the game screen stacks it: Wynik, Następne, Nowa gra and Opcje, Najlepsze wyniki. */
function Rail({ newGameDisabled, browsing, bonusGame = false }: RailProps) {
  const [shown, setShown] = useState(browsing ?? 6);
  const [bonus, setBonus] = useState(bonusGame);
  const score = bonusGame ? 4210 : 1240;
  const own = shown === 6 && bonus === bonusGame;
  const gameList = bonusGame ? bonusScores : scores;
  const list = own
    ? gameList
    : bonus
      ? shown === 6
        ? bonusScores
        : []
      : shown === 6
        ? scores
        : sevenColors.slice(0, shown === 7 ? 6 : 0);
  return (
    <RailFrame tall>
      {bonusGame ? (
        <ScorePanel score={score} cleared={312} delta={190} deltaBalls={9} deltaBonus={100} />
      ) : (
        <ScorePanel score={score} cleared={124} />
      )}
      <NextBalls colors={['blue', 'yellow', 'purple']} />
      <div className={styles.actions}>
        <Button variant="secondary" disabled={newGameDisabled}>
          Nowa gra
        </Button>
        <Button variant="secondary" disabled={newGameDisabled}>
          Opcje
        </Button>
      </div>
      <HighscoreList
        rows={
          own
            ? rowsWithLive(list, score)
            : list.map((entry, i) => ({ kind: 'stored', place: i + 1, entry }))
        }
        colorCount={shown}
        gameColorCount={6}
        onColorCountChange={setShown}
        bonus={bonus}
        gameBonus={bonusGame}
        onBonusChange={setBonus}
        current={{ place: placeFor(score, gameList), score }}
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

/** A bonus game just after a 9-ball clear: amber chip, bonus lists in the heading. */
export const BonusGame: Story = { args: { bonusGame: true } };

/** The candy ball theme: only the balls change. */
export const Candy: Story = {
  decorators: [(Story) => <div data-ball-theme="candy">{Story()}</div>],
};

/** The cats ball theme: the next balls are cats; the logo keeps its round balls. */
export const Cats: Story = {
  decorators: [(Story) => <div data-ball-theme="cats">{Story()}</div>],
};
