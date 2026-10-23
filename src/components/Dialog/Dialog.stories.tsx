import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoardStage } from '../../storybook/BoardStage';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';

const meta = {
  title: 'Dialogs/Dialog',
  component: Dialog,
  args: { title: 'Tytuł okna', onClose: fn(), children: 'Treść okna.' },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <BoardStage>{Story()}</BoardStage>],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Esc and a click on the scrim call onClose. */
export const Dismissible: Story = {
  args: { children: <Button variant="secondary">Zamknij</Button> },
};

/** Neither Esc nor the scrim closes it. */
export const NotDismissible: Story = { args: { dismissible: false } };
