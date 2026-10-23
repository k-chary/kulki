import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRng } from '../rules';
import { MemoryStorage } from '../storage/MemoryStorage';
import { GameScreen } from './GameScreen';

const meta = {
  title: 'Screen/GameScreen',
  component: GameScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GameScreen>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A new game with a seeded generator; playable, with turns animated (use the Motion switch for reduced motion). */
export const NewGame: Story = {
  args: { storage: new MemoryStorage(), rng: createRng(7) },
};
