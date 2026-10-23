import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusLine } from './StatusLine';

const meta = {
  title: 'Header/StatusLine',
  component: StatusLine,
} satisfies Meta<typeof StatusLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { lead: 'Kliknij kulkę, aby ją wybrać' } };

export const Selected: Story = {
  args: { lead: 'Wybrana kulka: ', strong: 'niebieska', tail: ' · kliknij puste pole' },
};

export const Resumed: Story = { args: { lead: 'Wczytano zapisaną grę' } };

export const NearlyFull: Story = {
  args: { lead: 'Zostały 2 wolne pola. Ruch bez zbicia zakończy grę.' },
};

export const GameOver: Story = { args: { lead: 'Koniec gry' } };
