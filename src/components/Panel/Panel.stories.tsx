import type { Meta, StoryObj } from '@storybook/react-vite';
import { RailFrame } from '../../storybook/RailFrame';
import { Panel } from './Panel';

const meta = {
  title: 'Rail/Panel',
  component: Panel,
  args: { label: 'Wynik', children: 'Zawartość panelu' },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
};

export const Grow: Story = {
  args: { label: 'Najlepsze wyniki', grow: true, children: 'Wypełnia resztę wysokości' },
  decorators: [(Story) => <RailFrame short>{Story()}</RailFrame>],
};
