import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import {
  findPath,
  getBall,
  sameCell,
  setBall,
  type Board as BoardData,
  type Cell,
  type Color,
} from '../../rules';
import { parseBoard } from '../../rules/testing';
import { readDuration } from '../../styles/motion';
import type { BallState } from '../Ball/Ball';
import type { FieldState } from '../Field/Field';
import { Board, type CellView } from './Board';
import styles from './Board.stories.module.css';

// The board drawn on the design canvas.
const SAMPLE = parseBoard(`
  .b..g...y
  ..p...o..
  g....b..r
  ..rrrr...
  .y..p....
  o..g..b..
  ..r.....p
  .b..y..r.
  p..o..g..
`);

interface Overlay {
  field?: FieldState;
  ball?: BallState;
  delayMs?: number;
}

/** Turns a board plus per-square overlays ("row,col") into the Board's cells. */
function cellsOf(board: BoardData, overlays: Record<string, Overlay> = {}): CellView[] {
  return board.map((color, index) => {
    const o = overlays[`${Math.floor(index / 9)},${index % 9}`] ?? {};
    return { color, state: o.field, ballState: o.ball, ballDelayMs: o.delayMs };
  });
}

const selected = { '7,7': { field: 'selected', ball: 'selected' } } satisfies Record<
  string,
  Overlay
>;
const preview = {
  ...selected,
  '6,7': { field: 'path' },
  '5,7': { field: 'path' },
  '4,7': { field: 'path' },
  '3,7': { field: 'path' },
  '3,6': { field: 'target' },
} satisfies Record<string, Overlay>;

const meta = {
  title: 'Board/Board',
  component: Board,
  args: {
    cells: cellsOf(SAMPLE),
    locked: false,
    onFieldClick: fn(),
    onFieldHover: fn(),
    onBallAnimationEnd: fn(),
    onMoveStepEnd: fn(),
  },
  argTypes: {
    cells: { control: false },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div className={styles.stage}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Board>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { cells: cellsOf(parseBoard('.........\n'.repeat(9))) } };

/** Nothing selected; hovering a ball lightens its field and lifts the ball. */
export const Idle: Story = {};

/** The selected field gets a ring and its ball hops. */
export const Selected: Story = { args: { cells: cellsOf(SAMPLE, selected), pathColor: 'red' } };

/** Hovering a reachable empty field: dots on every square passed and a dashed target. */
export const PathPreview: Story = { args: { cells: cellsOf(SAMPLE, preview), pathColor: 'red' } };

/** Hovering an unreachable field: no preview, not-allowed cursor. */
export const Blocked: Story = {
  args: { cells: cellsOf(SAMPLE, { ...selected, '0,0': { field: 'blocked' } }), pathColor: 'red' },
};

/** A click on an unreachable field shakes the selected ball; it stays selected. */
export const Shake: Story = {
  args: {
    cells: cellsOf(SAMPLE, { '7,7': { field: 'selected', ball: 'shake' } }),
    pathColor: 'red',
  },
};

const LINE = setBall(SAMPLE, { row: 3, col: 6 }, 'red');
const clearing = Object.fromEntries(
  [2, 3, 4, 5, 6].map((col) => [`3,${col}`, { field: 'clearing', ball: 'clearing' } as Overlay]),
);

// The sample with the three extra colors of a 9-color game mixed in.
const NINE = parseBoard(`
  .b..g.w.y
  ..p.k.o..
  g.i..b..r
  ..rrrr.k.
  .y..p..w.
  o..g..b..
  i.r..k..p
  .b..y..w.
  p..o.ig..
`);

/** A 9-color game: pink, white and black join; white gets a rim on light fields, black on dark. */
export const NineColors: Story = { args: { cells: cellsOf(NINE) } };

const whiteSelected = {
  '7,7': { field: 'selected', ball: 'selected' },
  '6,7': { field: 'path' },
  '5,7': { field: 'path' },
  '5,8': { field: 'target' },
} satisfies Record<string, Overlay>;

/** A white ball's path: on light fields the dots and ring use a grey that stays visible. */
export const WhitePath: Story = {
  args: { cells: cellsOf(NINE, whiteSelected), pathColor: 'white' },
};

const blackSelected = {
  '6,5': { field: 'selected', ball: 'selected' },
  '7,5': { field: 'path' },
  '7,6': { field: 'path' },
  '6,6': { field: 'target' },
} satisfies Record<string, Overlay>;

/** A black ball's path: on dark fields the dots and ring turn light grey. */
export const BlackPath: Story = {
  args: { cells: cellsOf(NINE, blackSelected), pathColor: 'black' },
};

/** A line of five fades out, locked; the board shows no hover feedback meanwhile. */
export const Clearing: Story = { args: { cells: cellsOf(LINE, clearing), locked: true } };

const SPAWNED = [
  { row: 0, col: 2, color: 'orange' },
  { row: 4, col: 6, color: 'green' },
  { row: 8, col: 8, color: 'blue' },
] as const;

/** Three new balls pop in, 60 ms apart (all together with reduced motion). */
export const Spawning: Story = {
  args: { locked: true },
  render: function Render(args) {
    // Read once the story is in the page, so the Motion toolbar applies.
    const [stagger, setStagger] = useState<number | null>(null);
    const measure = (el: HTMLDivElement | null) => {
      if (el && stagger === null) setStagger(motionToken('--dur-spawn-stagger'));
    };
    let board = SAMPLE;
    const overlays: Record<string, Overlay> = {};
    SPAWNED.forEach((s, i) => {
      board = setBall(board, s, s.color);
      overlays[`${s.row},${s.col}`] = { ball: 'spawning', delayMs: i * (stagger ?? 0) };
    });
    return (
      <div ref={measure}>
        {stagger !== null && <Board {...args} cells={cellsOf(board, overlays)} />}
      </div>
    );
  },
};

/** Locked while anything animates or a dialog is open: clicks and hovers are dropped. */
export const Locked: Story = { args: { locked: true } };

const SLIDE: Cell[] = [
  { row: 7, col: 7 },
  ...(findPath(SAMPLE, { row: 7, col: 7 }, { row: 3, col: 6 }) ?? []),
];

/** MovingBall slides square by square, --dur-step each; reduced motion jumps. Replayed here. */
export const Moving: Story = {
  args: { locked: true },
  render: function Render(args) {
    const [step, setStep] = useState(0);
    const nextStep = () => setStep((s) => (s + 1) % (SLIDE.length + 4));
    const at = SLIDE[Math.min(step, SLIDE.length - 1)] ?? { row: 7, col: 7 };
    const landed = step >= SLIDE.length - 1;
    useStepTimer(step, nextStep, landed ? 'pause' : 'step');
    const board = setBall(SAMPLE, { row: 7, col: 7 }, null);
    return (
      <Board
        {...args}
        cells={cellsOf(landed ? setBall(board, at, 'red') : board)}
        moving={landed ? undefined : { color: 'red', ...at }}
      />
    );
  },
};

/** A working board, with a toy move rule (no lines, no spawns), to try the props end to end. */
export const Playground: Story = {
  render: function Render(args) {
    const [board, setBoard] = useState(SAMPLE);
    const [selection, setSelection] = useState<Cell | null>(null);
    const [hover, setHover] = useState<Cell | null>(null);
    const [shake, setShake] = useState(false);
    const [slide, setSlide] = useState<{ color: Color; path: Cell[]; step: number } | null>(null);
    const color = selection && getBall(board, selection);
    const path =
      selection && hover && !getBall(board, hover) ? findPath(board, selection, hover) : null;

    const overlays: Record<string, Overlay> = {};
    const key = (c: Cell) => `${c.row},${c.col}`;
    if (selection)
      overlays[key(selection)] = { field: 'selected', ball: shake ? 'shake' : 'selected' };
    if (selection && hover && !getBall(board, hover)) {
      if (path) {
        path.forEach((c) => (overlays[key(c)] = { field: 'path' }));
        overlays[key(hover)] = { field: 'target' };
      } else overlays[key(hover)] = { field: 'blocked' };
    }

    const advance = () => {
      if (!slide) return;
      if (slide.step + 1 < slide.path.length) setSlide({ ...slide, step: slide.step + 1 });
      else {
        const last = slide.path[slide.path.length - 1];
        if (last) setBoard((b) => setBall(b, last, slide.color));
        setSlide(null);
      }
    };
    useStepTimer(slide?.step ?? -1, advance, slide ? 'step' : 'off');

    const onFieldClick = (cell: Cell) => {
      args.onFieldClick?.(cell);
      const ball = getBall(board, cell);
      if (ball) setSelection(selection && sameCell(selection, cell) ? null : cell);
      else if (selection && color) {
        const route = findPath(board, selection, cell);
        if (!route) return setShake(true);
        setBoard(setBall(board, selection, null));
        setSlide({ color, path: route, step: 0 });
        setSelection(null);
        setHover(null);
      }
    };

    const at = slide?.path[slide.step];
    return (
      <Board
        {...args}
        cells={cellsOf(board, slide ? {} : overlays)}
        pathColor={color ?? undefined}
        locked={slide !== null}
        moving={slide && at ? { color: slide.color, ...at } : undefined}
        onFieldClick={onFieldClick}
        onFieldHover={(cell) => {
          args.onFieldHover?.(cell);
          setHover(cell);
        }}
        onBallAnimationEnd={(cell) => {
          args.onBallAnimationEnd?.(cell);
          if (selection && sameCell(cell, selection)) setShake(false);
        }}
      />
    );
  },
};

/** Reads a motion token where the story renders, so the Motion toolbar applies. */
function motionToken(token: string): number {
  const pane = document.querySelector('[data-motion]') ?? document.documentElement;
  return readDuration(token, getComputedStyle(pane));
}

/**
 * Calls next() after --dur-step (or a fixed pause) each time step changes.
 * A story can't rely on transitionend: with reduced motion the step is 0 ms.
 */
function useStepTimer(step: number, next: () => void, mode: 'step' | 'pause' | 'off') {
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });
  useEffect(() => {
    if (mode === 'off') return;
    const ms = mode === 'pause' ? 700 : motionToken('--dur-step') + 30;
    const id = setTimeout(() => nextRef.current(), ms);
    return () => clearTimeout(id);
  }, [step, mode]);
}
