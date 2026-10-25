import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RailFrame } from '../../storybook/RailFrame';
import { CurrentGameNote } from './CurrentGameNote';

const meta = {
  title: 'Rail/CurrentGameNote',
  component: CurrentGameNote,
  args: { colorCount: 6, place: 4, score: 2310, onShow: fn() },
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof CurrentGameNote>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The game would take 4th place in its own (6-color) list. */
export const InTop30: Story = {};

/** Not enough points for its own top 30 yet. */
export const OutsideTop30: Story = { args: { place: null, score: 120 } };

export const Hover: Story = { args: { force: 'hover' } };

export const Focus: Story = { args: { force: 'focus' } };
