// Turns the events of a turn into the steps the screen plays back: what each
// step shows and how long it runs. The rules module has already computed the
// whole turn; this only decides what the screen looks like on the way.
import {
  type Board,
  type Cell,
  type Color,
  type GameEvent,
  type GameState,
  getBall,
  setBall,
} from '../rules';
import type { SequenceStep } from './sequencer';

/** The motion tokens playback needs, in ms (see readMotion in styles/motion.ts). */
export interface Durations {
  step: number;
  clear: number;
  spawn: number;
  spawnStagger: number;
}

/** What the screen shows at one moment of a turn. */
export interface PlaybackView {
  /** The balls standing on the board; the sliding ball is not among them. */
  board: Board;
  /** The ball sliding along its path, drawn over the board. */
  moving: { color: Color; row: number; col: number } | null;
  /** Balls fading out. */
  clearing: readonly Cell[];
  /** Balls popping in, in order; each starts one stagger after the one before. */
  spawning: readonly Cell[];
  preview: readonly Color[];
  score: number;
  cleared: number;
  /** Points just won; set on the step where the clear starts. */
  delta: number | null;
}

/** A frame for the moving ball to mount on the start square before it slides. */
export const LIFT_MS = 32;

/** The pure view of a state with nothing animating. */
export function restingView(state: GameState): PlaybackView {
  return {
    board: state.board,
    moving: null,
    clearing: [],
    spawning: [],
    preview: state.preview,
    score: state.score,
    cleared: state.cleared,
    delta: null,
  };
}

/**
 * The steps of a turn that starts from `before`, in the order of its events:
 * the slide (one step per square), then the clear and/or the spawn. The last
 * step shows the finished turn, which is `after`.
 */
export function buildSteps(
  before: GameState,
  after: GameState,
  events: readonly GameEvent[],
  durations: Durations,
): SequenceStep<PlaybackView>[] {
  const steps: SequenceStep<PlaybackView>[] = [];
  let view = restingView(before);

  for (const event of events) {
    switch (event.type) {
      case 'move': {
        const color = getBall(before.board, event.from) as Color;
        const lifted = setBall(view.board, event.from, null);
        if (durations.step > 0) {
          const moving = (cell: Cell) => ({ color, row: cell.row, col: cell.col });
          steps.push({
            view: { ...view, board: lifted, moving: moving(event.from) },
            duration: LIFT_MS,
          });
          for (const cell of event.path) {
            steps.push({
              view: { ...view, board: lifted, moving: moving(cell) },
              duration: durations.step,
              expect: 1,
            });
          }
        }
        view = { ...view, board: setBall(lifted, event.to, color), moving: null };
        steps.push({ view, duration: 0 });
        break;
      }
      case 'clear': {
        const score = view.score + event.points;
        steps.push({
          view: {
            ...view,
            clearing: event.cells,
            score,
            cleared: view.cleared + event.cells.length,
            delta: event.points,
          },
          duration: durations.clear,
          expect: event.cells.length,
        });
        const board = event.cells.reduce((next, cell) => setBall(next, cell, null), view.board);
        view = { ...view, board, score, cleared: view.cleared + event.cells.length };
        steps.push({ view, duration: 0 });
        break;
      }
      case 'spawn': {
        const board = event.cells.reduce(
          (next, cell, i) => setBall(next, cell, event.colors[i] as Color),
          view.board,
        );
        // The preview refreshes together with the new balls.
        view = { ...view, board, preview: after.preview };
        steps.push({
          view: { ...view, spawning: event.cells },
          duration: durations.spawn + (event.cells.length - 1) * durations.spawnStagger,
          expect: event.cells.length,
        });
        steps.push({ view, duration: 0 });
        break;
      }
      case 'gameOver':
        break;
    }
  }
  return steps;
}
