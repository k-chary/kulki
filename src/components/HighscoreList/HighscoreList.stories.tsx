import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import {
  placeFor,
  rowsWithLive,
  type HighscoreEntry,
  type HighscoreRow,
} from '../../highscores/ranking';
import { RailFrame } from '../../storybook/RailFrame';
import { HighscoreList } from './HighscoreList';

const POINTS = [
  3870, 3420, 3110, 2890, 2760, 2540, 2310, 2200, 1980, 1870, 1760, 1650, 1530, 1410, 1320, 1180,
  1090, 980, 910, 840, 760, 690, 620, 560, 490, 430, 380, 320, 270, 210,
];
const NAMES = ['Harry', 'Ola', 'Harry', 'Tomek', 'Ola', 'Harry', 'Bartłomiej Kowalczyk', 'Tomek'];

const full: HighscoreEntry[] = POINTS.map((score, i) => ({
  name: NAMES[i % NAMES.length] ?? 'Gracz',
  score,
  date: new Date(2026, 9, 18 - i * 3, 20).toISOString(),
  colorCount: 6,
  bonus: false,
}));

const few: HighscoreEntry[] = [
  {
    name: 'Harry',
    score: 640,
    date: new Date(2026, 9, 18, 20).toISOString(),
    colorCount: 6,
    bonus: false,
  },
  {
    name: 'Ola',
    score: 150,
    date: new Date(2026, 9, 12, 20).toISOString(),
    colorCount: 6,
    bonus: false,
  },
];

const meta = {
  title: 'Rail/HighscoreList',
  component: HighscoreList,
  decorators: [(Story) => <RailFrame short>{Story()}</RailFrame>],
} satisfies Meta<typeof HighscoreList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First launch: the message and only the current game, at place 1. */
export const Empty: Story = { args: { rows: rowsWithLive([], 0) } };

export const FewEntries: Story = { args: { rows: rowsWithLive(few, 320) } };

/** Thirty games; the current one is scrolled into view inside the panel. */
export const FullScrolling: Story = {
  args: { rows: rowsWithLive(full, 1240) },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** The current score is outside the top 30, so no „Ta gra” row. */
export const OutsideTop30: Story = {
  args: { rows: rowsWithLive(full, 100) },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** After „Zapisz wynik”: the new entry is ringed and scrolled into view. */
export const JustSaved: Story = {
  args: {
    rows: rowsWithLive(
      [
        ...full.slice(0, 22),
        {
          name: 'Harry',
          score: 640,
          date: new Date(2026, 9, 21, 20).toISOString(),
          colorCount: 6,
          bonus: false,
        },
        ...full.slice(22, 29),
      ],
      0,
    ).filter((row) => row.kind === 'stored'),
    savedPlace: 23,
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** Each color count keeps its own top 30; the heading names the list shown. */
export const PerColorCount: Story = {
  args: { rows: rowsWithLive(few, 320), colorCount: 8 },
};

/** Another count's list: stored rows only, the game in progress is not in it. */
const storedRows = (list: readonly HighscoreEntry[]): HighscoreRow[] =>
  list.map((entry, i) => ({ kind: 'stored', place: i + 1, entry }));

const eightColors: HighscoreEntry[] = full.slice(0, 9).map((entry) => ({
  ...entry,
  score: Math.round(entry.score / 3 / 10) * 10,
  colorCount: 8,
}));

/** The filter on the current game's list: the same rows as without it. */
export const FilterOnGameList: Story = {
  args: {
    rows: rowsWithLive(few, 320),
    colorCount: 6,
    gameColorCount: 6,
    onColorCountChange: fn(),
    current: { place: 2, score: 320 },
  },
};

/**
 * Browsing the 8-color list during a 6-color game: no „Ta gra” row in it, the
 * game's own place is pinned underneath instead.
 */
export const FilterOnOtherList: Story = {
  args: {
    rows: storedRows(eightColors),
    colorCount: 8,
    gameColorCount: 6,
    onColorCountChange: fn(),
    current: { place: placeFor(1240, full), score: 1240 },
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** The game is outside its own top 30, so the pinned line says so. */
export const FilterOtherListOutsideTop30: Story = {
  args: { ...FilterOnOtherList.args, current: { place: null, score: 100 } },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** Nobody has played 9 colors yet. */
export const FilterOnEmptyList: Story = {
  args: {
    rows: [],
    colorCount: 9,
    gameColorCount: 6,
    onColorCountChange: fn(),
    current: { place: 2, score: 320 },
  },
};

const lists: Record<number, HighscoreEntry[]> = {
  5: few.map((e) => ({ ...e, colorCount: 5 })),
  6: full,
  8: eightColors,
};

/** Click through the counts; the pinned line jumps back to the 6-color list. */
export const Interactive: Story = {
  args: { rows: [] },
  render: function Render() {
    const [shown, setShown] = useState(6);
    const score = 1240;
    const list = lists[shown] ?? [];
    return (
      <HighscoreList
        rows={shown === 6 ? rowsWithLive(list, score) : storedRows(list)}
        colorCount={shown}
        gameColorCount={6}
        onColorCountChange={setShown}
        current={{ place: placeFor(score, full), score }}
      />
    );
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

const bonusScores: HighscoreEntry[] = full.slice(0, 12).map((entry) => ({
  ...entry,
  score: entry.score * 3,
}));

/** A bonus game on its own list: both filters show and the heading says „z premią”. */
export const BonusOnGameList: Story = {
  args: {
    rows: rowsWithLive(bonusScores, 4210),
    colorCount: 6,
    gameColorCount: 6,
    onColorCountChange: fn(),
    bonus: true,
    gameBonus: true,
    onBonusChange: fn(),
    current: { place: placeFor(4210, bonusScores), score: 4210 },
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/**
 * Browsing the no-bonus list during a bonus game: same count, other scoring, so
 * the game's place is pinned underneath.
 */
export const BonusBrowsingPlainList: Story = {
  args: {
    ...BonusOnGameList.args,
    rows: storedRows(full),
    bonus: false,
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};

/** No bonus game has been played with 9 colors yet. */
export const BonusEmptyList: Story = {
  args: {
    rows: [],
    colorCount: 9,
    gameColorCount: 6,
    onColorCountChange: fn(),
    bonus: true,
    gameBonus: false,
    onBonusChange: fn(),
    current: { place: 2, score: 320 },
  },
};

/** Click through counts and scorings; the pinned line jumps back to the game's list. */
export const BonusInteractive: Story = {
  args: { rows: [] },
  render: function Render() {
    const [shown, setShown] = useState(6);
    const [bonus, setBonus] = useState(true);
    const score = 4210;
    const own = shown === 6 && bonus;
    const list = bonus ? (shown === 6 ? bonusScores : []) : (lists[shown] ?? []);
    return (
      <HighscoreList
        rows={own ? rowsWithLive(list, score) : storedRows(list)}
        colorCount={shown}
        gameColorCount={6}
        onColorCountChange={setShown}
        bonus={bonus}
        gameBonus
        onBonusChange={setBonus}
        current={{ place: placeFor(score, bonusScores), score }}
      />
    );
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};
