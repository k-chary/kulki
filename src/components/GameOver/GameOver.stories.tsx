import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoardStage } from '../../storybook/BoardStage';
import { GameOver } from './GameOver';

const entry = {
  state: 'entry',
  score: 1240,
  place: 4,
  initialName: 'Harry',
  onSave: fn(),
} as const;

const meta = {
  title: 'Dialogs/GameOver',
  component: GameOver,
  args: entry,
  argTypes: { returnFocusRef: { control: false } },
  decorators: [(Story) => <BoardStage>{Story()}</BoardStage>],
} satisfies Meta<typeof GameOver>;

export default meta;
type Story = StoryObj<typeof GameOver>;

/** Made the top 30: name field focused and selected; the dialog cannot be dismissed. */
export const NameEntry: Story = { args: entry };

export const NameEntryNewRecord: Story = { args: { ...entry, place: 1, score: 2830 } };

export const NameEntryFirstGame: Story = { args: { ...entry, initialName: '' } };

/** „Nowa gra” is focused. */
export const Saved: Story = {
  args: { state: 'saved', name: 'Harry', place: 4, onNewGame: fn() },
};

/** Nothing is saved. */
export const OutsideTop30: Story = {
  args: { state: 'outside', score: 120, missing: 380, onNewGame: fn() },
};
