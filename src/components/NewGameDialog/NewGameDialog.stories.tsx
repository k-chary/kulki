import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoardStage } from '../../storybook/BoardStage';
import { NewGameDialog } from './NewGameDialog';

const meta = {
  title: 'Dialogs/NewGameDialog',
  component: NewGameDialog,
  args: { colorCount: 6, score: null, onCancel: fn(), onStart: fn() },
  argTypes: { colorCount: { control: 'inline-radio', options: [5, 6, 7, 8, 9] } },
  decorators: [(Story) => <BoardStage>{Story()}</BoardStage>],
} satisfies Meta<typeof NewGameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the first move or after game over: nothing is lost, „Zacznij” is focused. */
export const NothingLost: Story = {};

/** A game in progress: the warning shows and „Anuluj” is focused. */
export const GameInProgress: Story = { args: { score: 1240 } };

/** Opens on the last game's count; here the hardest. */
export const NineColors: Story = { args: { colorCount: 9 } };
