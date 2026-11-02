import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoardStage } from '../../storybook/BoardStage';
import { OptionsDialog } from './OptionsDialog';

const meta = {
  title: 'Dialogs/OptionsDialog',
  component: OptionsDialog,
  args: { ballTheme: 'classic', onBallThemeChange: fn(), onClose: fn() },
  argTypes: { ballTheme: { control: 'inline-radio', options: ['classic', 'candy', 'cats'] } },
  decorators: [(Story) => <BoardStage>{Story()}</BoardStage>],
} satisfies Meta<typeof OptionsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: classic balls. */
export const Classic: Story = {};

export const Candy: Story = { args: { ballTheme: 'candy' } };

export const Cats: Story = { args: { ballTheme: 'cats' } };

/** Click a card: the board behind the dialog switches at once, as in the game. */
export const Playground: Story = {
  render: function Render(args) {
    const [theme, setTheme] = useState(args.ballTheme);
    return (
      <div data-ball-theme={theme}>
        <OptionsDialog {...args} ballTheme={theme} onBallThemeChange={setTheme} />
      </div>
    );
  },
};

/** In the game: two tabs, „Gra” first. */
export const WithTabs: Story = {
  args: { bonus: false, onBonusChange: fn() },
};

export const GameWithBonus: Story = {
  args: { ...WithTabs.args, bonus: true },
};

/** „Wygląd”, the second tab. */
export const LookTab: Story = {
  args: { ...WithTabs.args, initialTab: 'look' },
};

/** Click through everything: the theme applies at once, the scoring only waits for the next game. */
export const TabsPlayground: Story = {
  render: function Render(args) {
    const [theme, setTheme] = useState(args.ballTheme);
    const [bonus, setBonus] = useState(true);
    return (
      <div data-ball-theme={theme}>
        <OptionsDialog
          {...args}
          ballTheme={theme}
          onBallThemeChange={setTheme}
          bonus={bonus}
          onBonusChange={setBonus}
        />
      </div>
    );
  },
};
