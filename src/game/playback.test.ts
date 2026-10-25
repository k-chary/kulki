import { describe, expect, it } from 'vitest';
import { type GameState, createRng, playTurn } from '../rules';
import { parseBoard } from '../rules/testing';
import { type Durations, LIFT_MS, buildSteps } from './playback';

const FULL: Durations = { step: 40, clear: 300, spawn: 220, spawnStagger: 60 };
const REDUCED: Durations = { step: 0, clear: 150, spawn: 150, spawnStagger: 0 };

function game(board: string): GameState {
  return {
    board: parseBoard(board),
    preview: ['blue', 'green', 'purple'],
    colorCount: 6,
    score: 0,
    cleared: 0,
    gameOver: false,
  };
}

const EMPTY = Array.from({ length: 9 }, () => '.........');
const board = (rows: Record<number, string>) =>
  EMPTY.map((row, i) => rows[i]?.padEnd(9, '.') ?? row).join('\n');

function turn(
  state: GameState,
  from: [number, number],
  to: [number, number],
  durations: Durations,
) {
  const result = playTurn(
    state,
    { row: from[0], col: from[1] },
    { row: to[0], col: to[1] },
    createRng(2),
  );
  if (result.status !== 'played') throw new Error('no path');
  return buildSteps(state, result.state, result.events, durations);
}

describe('a move that spawns', () => {
  const start = game(board({ 0: 'r' }));
  const steps = turn(start, [0, 0], [0, 2], FULL);

  it('lifts, slides one step per square, then spawns the three balls', () => {
    const timed = steps.filter((step) => step.duration > 0);
    expect(timed.map((step) => step.duration)).toEqual([LIFT_MS, 40, 40, 220 + 2 * 60]);
    expect(timed.map((step) => step.expect ?? 0)).toEqual([0, 1, 1, 3]);
    const slides = timed.slice(0, 3).map((step) => step.view.moving);
    expect(slides).toEqual([
      { color: 'red', row: 0, col: 0 },
      { color: 'red', row: 0, col: 1 },
      { color: 'red', row: 0, col: 2 },
    ]);
  });

  it('keeps the ball off its start square while it slides', () => {
    expect(steps[1]?.view.board[0]).toBeNull();
    expect(steps[1]?.view.board[2]).toBeNull();
  });

  it('refreshes the preview and shows all balls only with the spawn', () => {
    const spawn = steps.find((step) => step.view.spawning.length > 0);
    if (!spawn) throw new Error('no spawn step');
    expect(spawn.view.preview).not.toEqual(start.preview);
    expect(steps[0]?.view.preview).toEqual(start.preview);
    expect(spawn.view.board.filter((square) => square !== null)).toHaveLength(4);
    expect(steps.at(-1)?.view.spawning).toEqual([]);
    expect(steps.at(-1)?.view.moving).toBeNull();
  });
});

describe('a move that clears', () => {
  const start = game(board({ 0: 'rrrr', 1: '........r' }));
  const steps = turn(start, [1, 8], [0, 4], FULL);

  it('fades the five balls, counts the points and ends on an empty board', () => {
    const clear = steps.find((step) => step.view.clearing.length > 0);
    if (!clear) throw new Error('no clear step');
    expect(clear.duration).toBe(300);
    expect(clear.expect).toBe(5);
    expect(clear.view).toMatchObject({ score: 50, cleared: 5, delta: 50 });
    expect(clear.view.board.filter((square) => square !== null)).toHaveLength(5);
    const last = steps[steps.length - 1]?.view;
    if (!last) throw new Error('no steps');
    expect(last.board.every((square) => square === null)).toBe(true);
    expect(last.score).toBe(50);
  });

  it('spawns nothing', () => {
    expect(steps.some((step) => step.view.spawning.length > 0)).toBe(false);
  });
});

describe('reduced motion', () => {
  it('jumps instead of sliding and spawns all balls together', () => {
    const steps = turn(game(board({ 0: 'r' })), [0, 0], [0, 2], REDUCED);
    expect(steps.some((step) => step.view.moving !== null)).toBe(false);
    const timed = steps.filter((step) => step.duration > 0);
    expect(timed).toHaveLength(1);
    expect(timed[0]).toMatchObject({ duration: 150, expect: 3 });
  });

  it('fades a clear in 150 ms', () => {
    const steps = turn(game(board({ 0: 'rrrr', 1: '........r' })), [1, 8], [0, 4], REDUCED);
    expect(steps.find((step) => step.view.clearing.length > 0)?.duration).toBe(150);
  });
});

describe('a spawn that completes a line', () => {
  it('spawns, then clears the line', () => {
    const start = game(board({ 0: 'bbbb', 1: 'b' }));
    const cells = [{ row: 0, col: 4 }];
    const clearCells = [0, 1, 2, 3, 4].map((col) => ({ row: 0, col }));
    const after: GameState = {
      ...start,
      board: parseBoard(board({ 1: 'b' })),
      score: 50,
      cleared: 5,
    };
    const steps = buildSteps(
      start,
      after,
      [
        {
          type: 'move',
          from: { row: 1, col: 0 },
          to: { row: 1, col: 1 },
          path: [{ row: 1, col: 1 }],
        },
        { type: 'spawn', cells, colors: ['blue'] },
        { type: 'clear', cells: clearCells, points: 50 },
      ],
      FULL,
    );
    const kinds = steps
      .filter((step) => step.expect)
      .map((step) =>
        step.view.clearing.length > 0 ? 'clear' : step.view.spawning.length > 0 ? 'spawn' : 'slide',
      );
    expect(kinds).toEqual(['slide', 'spawn', 'clear']);
    expect(steps.at(-1)?.view.score).toBe(50);
  });
});
