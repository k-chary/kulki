import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BallThemePicker } from './BallThemePicker';
import styles from './BallThemePicker.stories.module.css';

const meta = {
  title: 'Controls/BallThemePicker',
  component: BallThemePicker,
  args: { value: 'classic', onChange: fn() },
  argTypes: { value: { control: 'inline-radio', options: ['classic', 'candy', 'cats'] } },
  decorators: [(Story) => <div className={styles.frame}>{Story()}</div>],
} satisfies Meta<typeof BallThemePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: classic chosen. Each card shows its own balls whatever is chosen. */
export const Classic: Story = {};

/** Candy chosen: the M&M's-like colors, with brown in place of black. */
export const Candy: Story = { args: { value: 'candy' } };

/** Cats chosen: a cat's head per color, in the classic colors. */
export const Cats: Story = { args: { value: 'cats' } };

/** Hovering the card that is not chosen. */
export const Hover: Story = { args: { force: { theme: 'candy', state: 'hover' } } };

export const Focus: Story = { args: { force: { theme: 'classic', state: 'focus' } } };

/** Click to switch. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <BallThemePicker {...args} value={value} onChange={setValue} />;
  },
};
