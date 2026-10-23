import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Dialog } from '../Dialog/Dialog';
import { NameEntry } from './NameEntry';

const meta = {
  title: 'Dialogs/NameEntry',
  component: NameEntry,
  args: { place: 4, initialName: 'Harry', onSave: fn() },
  decorators: [
    (Story) => (
      <Dialog title="Koniec gry" dismissible={false}>
        {Story()}
      </Dialog>
    ),
  ],
} satisfies Meta<typeof NameEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The field opens focused with the last name selected. */
export const Prefilled: Story = {};

/** First game ever: empty field, „Gracz” as the placeholder. */
export const Empty: Story = { args: { initialName: '' } };

export const NewRecord: Story = { args: { place: 1 } };

/** The counter turns accent; further typing is blocked. */
export const AtTheLimit: Story = { args: { initialName: 'Bartłomiej Kowalczyk' } };
