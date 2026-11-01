import type { Meta, StoryObj } from '@storybook/react-vite';
import { RailFrame } from '../../storybook/RailFrame';
import { NextBalls } from './NextBalls';

const meta = {
  title: 'Rail/NextBalls',
  component: NextBalls,
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof NextBalls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { colors: ['blue', 'yellow', 'purple'] } };

/** After a spawn the new preview pops in with the board's stagger. */
export const Fresh: Story = { args: { colors: ['green', 'red', 'green'], fresh: true } };

/** Two free squares left: only two balls will appear. */
export const TwoLeft: Story = { args: { colors: ['blue', 'yellow'] } };

/** One free square left: only one ball will appear. */
export const OneLeft: Story = { args: { colors: ['blue'] } };
