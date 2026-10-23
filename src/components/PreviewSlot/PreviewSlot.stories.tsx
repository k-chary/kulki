import type { Meta, StoryObj } from '@storybook/react-vite';
import { COLORS } from '../../rules/color';
import { PreviewSlot } from './PreviewSlot';

const meta = {
  title: 'Rail/PreviewSlot',
  component: PreviewSlot,
  argTypes: { color: { control: 'select', options: COLORS } },
} satisfies Meta<typeof PreviewSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { color: 'blue' } };

export const Spawning: Story = { args: { color: 'green', state: 'spawning' } };

/** Only in Storybook; the game always has three colors. */
export const Empty: Story = { args: {} };
