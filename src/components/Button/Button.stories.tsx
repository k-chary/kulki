import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Controls/Button',
  component: Button,
  args: { variant: 'secondary', children: 'Nowa gra' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// data-force only exists so stories can hold hover, pressed and focus.
const hover = { 'data-force': 'hover' } as object;
const active = { 'data-force': 'active' } as object;
const focus = { 'data-force': 'focus' } as object;

export const Primary: Story = { args: { variant: 'primary', children: 'Zapisz wynik' } };
export const PrimaryHover: Story = { args: { ...Primary.args, ...hover } };
export const PrimaryPressed: Story = { args: { ...Primary.args, ...active } };
export const PrimaryFocus: Story = { args: { ...Primary.args, ...focus } };
export const PrimaryDisabled: Story = { args: { ...Primary.args, disabled: true } };

export const Secondary: Story = {};
export const SecondaryHover: Story = { args: hover };
export const SecondaryPressed: Story = { args: active };
export const SecondaryFocus: Story = { args: focus };
export const SecondaryDisabled: Story = { args: { disabled: true } };

/** Full width, as the rail's „Nowa gra” and dialog actions use it. */
export const Block: Story = { args: { block: true } };
