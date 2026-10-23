import type { Meta, StoryObj } from '@storybook/react-vite';
import { rowsWithLive, type HighscoreEntry } from '../../highscores/ranking';
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
}));

const few: HighscoreEntry[] = [
  { name: 'Harry', score: 640, date: new Date(2026, 9, 18, 20).toISOString() },
  { name: 'Ola', score: 150, date: new Date(2026, 9, 12, 20).toISOString() },
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
        { name: 'Harry', score: 640, date: new Date(2026, 9, 21, 20).toISOString() },
        ...full.slice(22, 29),
      ],
      0,
    ).filter((row) => row.kind === 'stored'),
    savedPlace: 23,
  },
  decorators: [(Story) => <RailFrame tall>{Story()}</RailFrame>],
};
