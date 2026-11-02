import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Primitives/Chip',
  component: Chip,
  args: { children: '+50' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tinted, small: a plain gain (bonus step 0). */
export const Soft: Story = {};

/** Solid accent, medium (bonus step 1). */
export const Accent: Story = { args: { tone: 'accent', size: 'md', children: '+80' } };

/** Amber, large (bonus step 2). */
export const Warm: Story = { args: { tone: 'warm', size: 'lg', children: '+190' } };

/** Hot, largest, with one pulse as it appears (bonus step 3). */
export const Hot: Story = { args: { tone: 'hot', size: 'xl', pulse: true, children: '+420' } };

/** Small uppercase text instead of a number. */
export const Label: Story = {
  args: { tone: 'accent', size: 'xs', text: 'label', children: 'Nowy rekord' },
};

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
      <Chip>+50</Chip>
      <Chip tone="accent" size="md">
        +80
      </Chip>
      <Chip tone="warm" size="lg">
        +190
      </Chip>
      <Chip tone="hot" size="xl">
        +420
      </Chip>
    </div>
  ),
};
