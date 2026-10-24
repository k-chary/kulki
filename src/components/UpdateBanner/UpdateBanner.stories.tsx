import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpdateBanner } from './UpdateBanner';

const meta = {
  title: 'Header/UpdateBanner',
  component: UpdateBanner,
  args: { version: '0.2.0', onInstall: () => undefined, onDismiss: () => undefined },
} satisfies Meta<typeof UpdateBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = { args: { phase: 'available' } };

export const Installing: Story = {
  args: { phase: 'installing', progress: 0.42, onDismiss: undefined },
};

export const InstallingUnknownSize: Story = {
  args: { phase: 'installing', progress: null, onDismiss: undefined },
};

export const Failed: Story = { args: { phase: 'failed' } };
