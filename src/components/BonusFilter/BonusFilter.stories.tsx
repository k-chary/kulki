import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RailFrame } from '../../storybook/RailFrame';
import { BonusFilter } from './BonusFilter';

const meta = {
  title: 'Rail/BonusFilter',
  component: BonusFilter,
  args: { value: false, gameBonus: false, onChange: fn() },
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof BonusFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Showing the current game's lists: its scoring is chosen and dotted. */
export const GameList: Story = {};

/** A bonus game showing its own lists. */
export const BonusGame: Story = { args: { value: true, gameBonus: true } };

/** Browsing the bonus lists during a game without the bonus; the dot stays put. */
export const OtherList: Story = { args: { value: true } };

export const Hover: Story = { args: { force: { bonus: true, state: 'hover' } } };

export const Focus: Story = { args: { force: { bonus: true, state: 'focus' } } };
