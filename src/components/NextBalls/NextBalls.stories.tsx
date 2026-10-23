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
