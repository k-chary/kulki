import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RailFrame } from '../../storybook/RailFrame';
import { HighscoreFilter } from './HighscoreFilter';

const meta = {
  title: 'Rail/HighscoreFilter',
  component: HighscoreFilter,
  args: { value: 6, gameColorCount: 6, onChange: fn() },
  argTypes: {
    value: { control: 'inline-radio', options: [5, 6, 7, 8, 9] },
    gameColorCount: { control: 'inline-radio', options: [5, 6, 7, 8, 9] },
  },
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof HighscoreFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Showing the current game's list: its count is chosen and dotted. */
export const GameList: Story = {};

/** Browsing the 8-color list during a 6-color game; the dot stays on 6. */
export const OtherList: Story = { args: { value: 8 } };

export const Hover: Story = { args: { force: { count: 9, state: 'hover' } } };

export const Focus: Story = { args: { force: { count: 7, state: 'focus' } } };
