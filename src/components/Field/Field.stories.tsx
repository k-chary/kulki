import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Ball } from '../Ball/Ball';
import { Field, type FieldProps } from './Field';
import styles from './Field.stories.module.css';

type FieldStoryArgs = FieldProps & { ballSelected?: boolean };

function FieldTile({ ballSelected, ...props }: FieldStoryArgs) {
  return (
    <div className={styles.row}>
      <div className={styles.state}>
        <div className={styles.tile}>
          <Field {...props}>
            {props.hasBall && <Ball color="red" state={ballSelected ? 'selected' : 'idle'} />}
          </Field>
        </div>
        <span>{props.label}</span>
      </div>
    </div>
  );
}

const meta = {
  title: 'Board/Field',
  component: Field,
  args: {
    row: 3,
    col: 6,
    state: 'idle',
    hasBall: false,
    label: 'Puste pole, wiersz 4, kolumna 7',
    locked: false,
    forceHover: false,
    onClick: fn(),
    onPointerEnter: fn(),
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['idle', 'selected', 'path', 'target', 'blocked', 'clearing'],
    },
    children: { control: false },
  },
  render: (args) => <FieldTile {...args} />,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

const withBall = { hasBall: true, label: 'Kulka czerwona, wiersz 4, kolumna 7' };

/** Hover does nothing while no ball is selected. */
export const IdleEmpty: Story = {};

/** Pointer cursor: a ball can always be selected. */
export const IdleBall: Story = { args: withBall };

/** Lightens, and the ball scales to 1.06. */
export const HoverBall: Story = { args: { ...withBall, forceHover: true } };

/** 2 px inset ring; the ball hops. */
export const Selected: Story = {
  args: { ...withBall, state: 'selected' },
  render: (args) => <FieldTile {...args} ballSelected />,
};

/** A dot in the selected ball's color on every square the ball will pass. */
export const Path: Story = { args: { state: 'path' } };

/** The hovered reachable square: dashed ring in the ball's color. */
export const Target: Story = { args: { state: 'target' } };

/** The hovered unreachable square: looks idle, not-allowed cursor. */
export const Blocked: Story = { args: { state: 'blocked' } };

/** Lightens while its ball fades. */
export const Clearing: Story = { args: { ...withBall, state: 'clearing' } };

/** While locked there is no hover feedback and the cursor is the default arrow. */
export const Locked: Story = { args: { ...withBall, locked: true } };

/** Keyboard focus ring (fields are buttons, though v1 has no keyboard play). */
export const FocusVisible: Story = {
  play: async ({ canvas }) => {
    canvas.getAllByRole('button')[0]?.focus();
  },
};
