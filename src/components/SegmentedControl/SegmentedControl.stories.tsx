import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SegmentedControl } from './SegmentedControl';

const COUNTS = [5, 6, 7, 8, 9].map((count) => ({ value: count, label: String(count) }));
const WORDS = [
  { value: false, label: 'Bez premii' },
  { value: true, label: 'Z premią' },
];

const meta = {
  title: 'Primitives/SegmentedControl',
  component: SegmentedControl<number>,
  args: { options: COUNTS, value: 6, onChange: fn(), ariaLabel: 'Liczba' },
  decorators: [(Story) => <div style={{ width: 'var(--rail-width, 20rem)' }}>{Story()}</div>],
} satisfies Meta<typeof SegmentedControl<number>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Numbers in the mono font, regular size. */
export const Numeric: Story = {};

export const Hover: Story = { args: { force: { value: 8, state: 'hover' } } };

export const Focus: Story = { args: { force: { value: 7, state: 'focus' } } };

/** The rail's size. */
export const Compact: Story = { args: { size: 'compact' } };

/** A dot under the setting the current game uses. */
export const CompactMarked: Story = {
  args: {
    size: 'compact',
    options: COUNTS.map((option) => ({ ...option, marked: option.value === 6 })),
    value: 8,
  },
};

export const CompactHover: Story = {
  args: { size: 'compact', force: { value: 9, state: 'hover' } },
};

export const CompactFocus: Story = {
  args: { size: 'compact', force: { value: 7, state: 'focus' } },
};

/** Words in the body font. */
export const Words: Story = {
  args: { options: WORDS as never, value: false as never, text: 'text' },
};

export const CompactWordsMarked: Story = {
  args: {
    options: WORDS.map((option) => ({ ...option, marked: option.value })) as never,
    value: false as never,
    size: 'compact',
    text: 'text',
  },
};

/** Click to switch. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};
