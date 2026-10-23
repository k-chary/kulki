import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { COLORS } from '../../rules';
import { Field } from '../Field/Field';
import { Ball, type BallProps, type BallState } from './Ball';
import styles from './Ball.stories.module.css';

/** Replays one-shot animations (shake, clear, spawn) so the story keeps showing them. */
function Replaying({ state, ...props }: BallProps) {
  const [round, setRound] = useState(0);
  const loops = state === 'shake' || state === 'clearing' || state === 'spawning';
  return (
    <Ball
      key={round}
      state={state}
      {...props}
      onAnimationEnd={loops ? () => setTimeout(() => setRound((r) => r + 1), 700) : undefined}
    />
  );
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.state}>
      <div className={styles.tile}>{children}</div>
      <span>{label}</span>
    </div>
  );
}

function InField({
  color,
  state,
  hover,
}: Pick<BallProps, 'color' | 'state'> & { hover?: boolean }) {
  return (
    <Field
      row={0}
      col={0}
      hasBall
      label="Kulka"
      state={state === 'selected' ? 'selected' : state === 'clearing' ? 'clearing' : 'idle'}
      forceHover={hover}
    >
      <Replaying color={color} state={state} />
    </Field>
  );
}

const meta = {
  title: 'Board/Ball',
  component: Ball,
  args: { color: 'red', state: 'idle' },
  argTypes: {
    color: { control: 'inline-radio', options: COLORS },
    state: {
      control: 'inline-radio',
      options: ['idle', 'selected', 'shake', 'clearing', 'spawning'] satisfies BallState[],
    },
  },
  render: (args) => (
    <Tile label={args.state ?? 'idle'}>
      <InField color={args.color} state={args.state} />
    </Tile>
  ),
} satisfies Meta<typeof Ball>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

/** Hover comes from the Field: it lightens and the ball scales to 1.06. */
export const Hover: Story = {
  render: (args) => (
    <Tile label="hover">
      <InField color={args.color} hover />
    </Tile>
  ),
};

/** Hops 14% of its size in a 900 ms loop. Reduced motion: no hop, the ring alone marks it. */
export const Selected: Story = { args: { state: 'selected' } };

/** No path to the clicked field: ±8% sideways, twice, 320 ms. Replayed here. */
export const Shake: Story = { args: { state: 'shake' } };

/** Fades and shrinks to 60% in 300 ms; reduced motion fades only, 150 ms. Replayed here. */
export const Clearing: Story = { args: { state: 'clearing', color: 'green' } };

/** Pops in with an overshoot, 220 ms; reduced motion fades only, 150 ms. Replayed here. */
export const Spawning: Story = { args: { state: 'spawning', color: 'blue' } };

/** Every color and state in one place. */
export const AllStates: Story = {
  render: () => (
    <div className={styles.row}>
      {COLORS.map((color) => (
        <Tile key={color} label={color}>
          <InField color={color} />
        </Tile>
      ))}
      <Tile label="hover">
        <InField color="red" hover />
      </Tile>
      {(['selected', 'shake', 'clearing', 'spawning'] as const).map((state) => (
        <Tile key={state} label={state}>
          <InField color="red" state={state} />
        </Tile>
      ))}
    </div>
  ),
};

/** The size comes from the parent: a field, a 44 px preview slot, or the 14 px logo dots. */
export const Sizes: Story = {
  render: () => (
    <div className={styles.row}>
      <Tile label="field">
        <InField color="purple" />
      </Tile>
      <div className={styles.state}>
        <span className={styles.slot}>
          <Ball color="purple" />
        </span>
        <span>preview slot</span>
      </div>
      <div className={styles.state}>
        <span className={styles.dots}>
          <Ball color="red" />
          <Ball color="yellow" />
          <Ball color="blue" />
        </span>
        <span>logo dots</span>
      </div>
    </div>
  ),
};
