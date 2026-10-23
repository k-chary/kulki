import type { Preview } from '@storybook/react-vite';
import { ThemeFrame, type MotionChoice, type ThemeChoice } from '../src/storybook/ThemeFrame';
import '../src/styles/fonts';
import '../src/styles/tokens.css';
import '../src/styles/global.css';
import '../src/storybook/storybook.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'side', title: 'Side by side' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion',
      toolbar: {
        title: 'Motion',
        icon: 'lightning',
        items: [
          { value: 'full', title: 'Full motion' },
          { value: 'reduced', title: 'Reduced motion' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', motion: 'full' },
  decorators: [
    (Story, context) => (
      <ThemeFrame
        theme={context.globals.theme as ThemeChoice}
        motion={context.globals.motion as MotionChoice}
      >
        <Story />
      </ThemeFrame>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
};

export default preview;
