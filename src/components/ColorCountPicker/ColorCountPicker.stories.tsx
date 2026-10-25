import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ColorCountPicker } from './ColorCountPicker';
import styles from './ColorCountPicker.stories.module.css';

const meta = {
  title: 'Controls/ColorCountPicker',
  component: ColorCountPicker,
  args: { value: 6, onChange: fn() },
  argTypes: { value: { control: 'inline-radio', options: [5, 6, 7, 8, 9] } },
  decorators: [(Story) => <div className={styles.frame}>{Story()}</div>],
} satisfies Meta<typeof ColorCountPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The classic game: six colors. */
export const Classic: Story = {};

export const Easiest: Story = { args: { value: 5 } };

/** All nine colors, pink, brown and black included. */
export const Hardest: Story = { args: { value: 9 } };

/** Hovering a count that is not chosen. */
export const Hover: Story = { args: { force: { count: 8, state: 'hover' } } };

export const Focus: Story = { args: { force: { count: 7, state: 'focus' } } };

/** Every count, to compare the strips and level names. */
export const AllCounts: Story = {
  render: () => (
    <>
      {[5, 6, 7, 8, 9].map((count) => (
        <ColorCountPicker key={count} value={count} />
      ))}
    </>
  ),
};

/** Click to switch. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ColorCountPicker {...args} value={value} onChange={setValue} />;
  },
};
