import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoardStage } from '../../storybook/BoardStage';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  args: { score: 1240, onCancel: fn(), onConfirm: fn() },
  decorators: [(Story) => <BoardStage>{Story()}</BoardStage>],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** „Anuluj” is focused; Esc and the scrim cancel too. */
export const Default: Story = {};

export const SmallScore: Story = { args: { score: 20 } };

/** After picking another count in „Kolory” mid-game. */
export const ColorCount: Story = { args: { colorCount: 8 } };
