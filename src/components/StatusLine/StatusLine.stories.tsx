import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusLine } from './StatusLine';

const meta = {
  title: 'Header/StatusLine',
  component: StatusLine,
} satisfies Meta<typeof StatusLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Most of the time the line is empty. */
export const Idle: Story = { args: { lead: '' } };

export const NoPath: Story = { args: { lead: 'Tam nie ma przejścia' } };

export const Resumed: Story = { args: { lead: 'Wczytano zapisaną grę' } };

export const NearlyFull: Story = {
  args: { lead: 'Zostały 2 wolne pola. Ruch bez zbicia zakończy grę.' },
};

export const GameOver: Story = { args: { lead: 'Koniec gry' } };
