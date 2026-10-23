import type { Meta, StoryObj } from '@storybook/react-vite';
import { RailFrame } from '../../storybook/RailFrame';
import { ScoreRow } from './ScoreRow';

const meta = {
  title: 'Rail/ScoreRow',
  component: ScoreRow,
  decorators: [
    (Story) => (
      <RailFrame>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>{Story()}</ol>
      </RailFrame>
    ),
  ],
  args: {
    kind: 'stored',
    place: 1,
    name: 'Harry',
    score: 3870,
    date: '2026-10-18T19:42:00.000Z',
    striped: true,
  },
} satisfies Meta<typeof ScoreRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StoredStriped: Story = {};

export const Stored: Story = { args: { place: 2, name: 'Ola', score: 3420, striped: false } };

/** Long names end in an ellipsis; the date keeps its own line. */
export const LongName: Story = {
  args: { place: 7, name: 'Bartłomiej Kowalczyk', score: 2310, date: '2026-09-30T10:00:00.000Z' },
};

/** The game in progress at the place it would take. */
export const Current: Story = { args: { kind: 'current', place: 16, score: 1240, striped: false } };

/** The entry just saved keeps an accent ring until the next game. */
export const Saved: Story = {
  args: { kind: 'saved', place: 16, score: 1240, date: '2026-10-21T18:00:00.000Z' },
};
