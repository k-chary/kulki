import type { Meta, StoryObj } from '@storybook/react-vite';
import { UndoControl } from './UndoControl';

const meta = {
  title: 'Controls/UndoControl',
  component: UndoControl,
  args: { status: 'ok', cost: 20, onUndo: () => undefined },
} satisfies Meta<typeof UndoControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or focus the button: the tooltip names the cost and Ctrl+Z. */
export const Default: Story = {};

/** The button's own hover, pressed and focus looks are in Controls/Button. */
export const Disabled: Story = { args: { status: 'nothing' } };

/** Too few points: the tooltip says what the undo costs; the chip stays at full color. */
export const TooFewPoints: Story = { args: { status: 'tooFewPoints' } };

export const GameOver: Story = { args: { status: 'gameOver' } };

/** While a turn animates or a dialog is open. */
export const Busy: Story = { args: { busy: true } };

/** The cost at every color count, 5 to 10. */
export const EveryCost: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {[10, 20, 30, 40, 50, 60].map((cost) => (
        <UndoControl key={cost} {...args} cost={cost} />
      ))}
    </div>
  ),
};

/** The phone's top bar: icon only, 44 px, with the short chip. */
export const IconOnlyPhone: Story = { args: { compact: true } };

export const IconOnlyPhoneDisabled: Story = { args: { compact: true, status: 'tooFewPoints' } };
