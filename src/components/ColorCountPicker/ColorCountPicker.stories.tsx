import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RailFrame } from '../../storybook/RailFrame';
import { ColorCountPicker } from './ColorCountPicker';

const meta = {
  title: 'Rail/ColorCountPicker',
  component: ColorCountPicker,
  args: { value: 6, onChange: fn(), disabled: false },
  argTypes: { value: { control: 'inline-radio', options: [4, 5, 6, 7, 8, 9] } },
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof ColorCountPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The classic game: six colors. */
export const Classic: Story = {};

export const Easiest: Story = { args: { value: 4 } };

/** All nine colors, pink, white and black included. Each tooltip names the difficulty. */
export const Hardest: Story = { args: { value: 9 } };

/** Hovering a count that is not chosen. */
export const Hover: Story = { args: { force: { count: 8, state: 'hover' } } };

export const Focus: Story = { args: { force: { count: 7, state: 'focus' } } };

/** During an animation or a dialog, like „Nowa gra”. */
export const Disabled: Story = { args: { disabled: true } };

/** Every count, as the rail shows it. */
export const AllCounts: Story = {
  render: () => (
    <>
      {[4, 5, 6, 7, 8, 9].map((count) => (
        <ColorCountPicker key={count} value={count} />
      ))}
    </>
  ),
};

/** Click to switch; in the game a switch starts a new game (or asks first). */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ColorCountPicker {...args} value={value} onChange={setValue} />;
  },
};
