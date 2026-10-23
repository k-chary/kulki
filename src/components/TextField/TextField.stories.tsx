import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextField, type TextFieldProps } from './TextField';

function Stateful(props: TextFieldProps) {
  const [value, setValue] = useState(props.value);
  return <TextField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Controls/TextField',
  component: TextField,
  render: (args) => <Stateful {...args} />,
  decorators: [(Story) => <div style={{ maxWidth: 'var(--dialog-width)' }}>{Story()}</div>],
  args: {
    id: 'name',
    label: 'Twoje imię',
    value: '',
    placeholder: 'Gracz',
    hint: 'Puste pole zapisze wynik jako „Gracz”.',
    onChange: () => {},
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** Opens focused with the text selected, so typing replaces it and Enter keeps it. */
export const PrefilledFocused: Story = {
  args: { value: 'Harry', ...({ 'data-force': 'focus' } as object) },
};

export const Hover: Story = {
  args: { value: 'Harry', ...({ 'data-force': 'hover' } as object) },
};

/** The counter turns accent; further typing is blocked. */
export const AtTheLimit: Story = { args: { value: 'Bartłomiej Kowalczyk' } };
