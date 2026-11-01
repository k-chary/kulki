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

/** With the next game's settings: two tabs, „Wygląd” first. */
export const WithTabs: Story = {
  args: { nextGame: { colorCount: 6, bonus: false }, onNextGameChange: fn() },
};

/** „Następna gra”: color count and scoring, waiting for the next game. */
export const NextGame: Story = {
  args: { ...WithTabs.args, initialTab: 'next' },
};

export const NextGameWithBonus: Story = {
  args: { ...WithTabs.args, nextGame: { colorCount: 8, bonus: true }, initialTab: 'next' },
};

/** Click through everything: the theme applies at once, the next-game settings only remember. */
export const NextGamePlayground: Story = {
  render: function Render(args) {
    const [theme, setTheme] = useState(args.ballTheme);
    const [next, setNext] = useState({ colorCount: 7, bonus: true });
    return (
      <div data-ball-theme={theme}>
        <OptionsDialog
          {...args}
          ballTheme={theme}
          onBallThemeChange={setTheme}
          nextGame={next}
          onNextGameChange={setNext}
        />
      </div>
    );
  },
};
