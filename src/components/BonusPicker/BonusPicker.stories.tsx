import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import styles from '../ColorCountPicker/ColorCountPicker.stories.module.css';
import { BonusPicker } from './BonusPicker';

const meta = {
  title: 'Controls/BonusPicker',
  component: BonusPicker,
  args: { value: false, onChange: fn() },
  decorators: [(Story) => <div className={styles.frame}>{Story()}</div>],
} satisfies Meta<typeof BonusPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: flat 10 points per ball. */
export const Off: Story = {};

/** The bonus for long clears is on. */
export const On: Story = { args: { value: true } };

export const Hover: Story = { args: { force: { bonus: true, state: 'hover' } } };

export const Focus: Story = { args: { force: { bonus: true, state: 'focus' } } };

/** Click to switch. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <BonusPicker {...args} value={value} onChange={setValue} />;
  },
};
