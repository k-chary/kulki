import { describe, expect, it } from 'vitest';
import { type Board, type Cell, CELL_COUNT, emptyCells, setBall } from './board';
import type { Color } from './color';
import {
  type GameState,
  deserialize,
  newGame,
  playTurn,
  serialize,
  SPAWN_COUNT,
  START_BALLS,
} from './game';
import { findAllLines } from './lines';
import { createRng, type Rng } from './random';
import { parseBoard } from './testing';

const at = (row: number, col: number): Cell => ({ row, col });
const PREVIEW: readonly Color[] = ['green', 'blue', 'purple'];

function stateOf(board: Board, extra: Partial<GameState> = {}): GameState {
  return { board, preview: PREVIEW, score: 0, cleared: 0, gameOver: false, ...extra };
}

function balls(board: Board): number {
  return board.filter((color) => color !== null).length;
}

/** A board filled with a pattern that never forms a line, with `holes` left empty. */
function crowded(holes: readonly Cell[]): Board {
  // Colors repeat every 5 squares along a row and shift per row, so no run reaches 5.
  const colors: Color[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  let board: Board = Array.from(
    { length: CELL_COUNT },
    (_, i) => colors[(Math.floor(i / 9) * 2 + (i % 9)) % 6] as Color,
  );
  for (const hole of holes) board = setBall(board, hole, null);
  return board;
}

describe('newGame', () => {
  it('places 5 balls with no line and a preview of 3 colors', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const state = newGame(createRng(seed));
      expect(balls(state.board)).toBe(START_BALLS);
      expect(findAllLines(state.board)).toEqual([]);
      expect(state.preview).toHaveLength(SPAWN_COUNT);
      expect(state).toMatchObject({ score: 0, cleared: 0, gameOver: false });
    }
  });

  it('is repeatable for the same seed', () => {
    expect(newGame(createRng(7))).toEqual(newGame(createRng(7)));
  });

  it('redraws the start when the 5 balls form a line', () => {
    // Zeros pick squares 0 to 4 (one row) and the color red five times: a line.
    const fallback = createRng(3);
    let calls = 0;
    const rigged: Rng = () => (calls++ < 10 ? 0 : fallback());
    const state = newGame(rigged);
    expect(calls).toBeGreaterThan(10);
    expect(balls(state.board)).toBe(START_BALLS);
    expect(findAllLines(state.board)).toEqual([]);
  });
});

describe('playTurn: rejected moves', () => {
  const board = parseBoard(`
    r........
    .........
    .........
    .........
    .........
    .........
    .........
    .........
    ......bb.
  `);
  const state = stateOf(setBall(board, at(0, 1), 'blue'));
  const rng = createRng(1);

  it('rejects an empty source', () => {
    expect(playTurn(state, at(4, 4), at(5, 5), rng)).toEqual({ status: 'noPath', state });
  });

  it('rejects an occupied target', () => {
    expect(playTurn(state, at(0, 0), at(0, 1), rng)).toEqual({ status: 'noPath', state });
  });

  it('rejects moving onto the same square', () => {
    expect(playTurn(state, at(0, 0), at(0, 0), rng)).toEqual({ status: 'noPath', state });
  });

  it('rejects an unreachable target', () => {
    const walled = stateOf(
      parseBoard(`
        rb.......
        b........
        .........
        .........
        .........
        .........
        .........
        .........
        .........
      `),
    );
    expect(playTurn(walled, at(0, 0), at(5, 5), rng)).toEqual({ status: 'noPath', state: walled });
  });

  it('throws for a finished game and for cells off the board', () => {
    expect(() => playTurn({ ...state, gameOver: true }, at(0, 0), at(2, 2), rng)).toThrow();
    expect(() => playTurn(state, at(0, 0), at(9, 0), rng)).toThrow(RangeError);
  });
});

describe('playTurn: a move that clears', () => {
  const board = parseBoard(`
    rr.rr....
    .........
    .........
    .........
    .........
    .........
    .........
    .........
    .....r...
  `);
  const start = stateOf(board, { score: 20, cleared: 2 });

  it('moves, clears, scores and spawns nothing', () => {
    const rng = createRng(1);
    const result = playTurn(start, at(8, 5), at(0, 2), rng);
    if (result.status !== 'played') throw new Error('expected a played turn');
    expect(result.events.map((event) => event.type)).toEqual(['move', 'clear']);
    expect(result.events[1]).toEqual({
      type: 'clear',
      cells: [at(0, 0), at(0, 1), at(0, 2), at(0, 3), at(0, 4)],
      points: 50,
    });
    expect(result.state).toEqual({
      board: parseBoard(`
        .........
        .........
        .........
        .........
        .........
        .........
        .........
        .........
        .........
      `),
      preview: PREVIEW,
      score: 70,
      cleared: 7,
      gameOver: false,
    });
  });

  it('does not touch the random generator', () => {
    let calls = 0;
    playTurn(start, at(8, 5), at(0, 2), () => (calls++, 0.5));
    expect(calls).toBe(0);
  });

  it('reports the shortest path in the move event', () => {
    const result = playTurn(start, at(8, 5), at(0, 2), createRng(1));
    if (result.status !== 'played') throw new Error('expected a played turn');
    const move = result.events[0];
    if (move?.type !== 'move') throw new Error('expected a move');
    expect(move.from).toEqual(at(8, 5));
    expect(move.to).toEqual(at(0, 2));
    expect(move.path).toHaveLength(8 + 3);
    expect(move.path.at(-1)).toEqual(at(0, 2));
  });

  it('counts a shared ball once when lines cross', () => {
    const cross = stateOf(
      parseBoard(`
        ....r....
        ....r....
        ....r....
        ....r....
        rrrr.....
        .....rrrr
        .........
        .........
        .........
      `),
    );
    // Dropping a red ball into (4, 4) completes a row and a column that share it.
    const result = playTurn(cross, at(5, 5), at(4, 4), createRng(1));
    if (result.status !== 'played') throw new Error('expected a played turn');
    const clear = result.events[1];
    if (clear?.type !== 'clear') throw new Error('expected a clear');
    expect(clear.cells).toHaveLength(9);
    expect(clear.points).toBe(90);
    expect(result.state.score).toBe(90);
  });
});

describe('playTurn: a move that does not clear', () => {
  const board = parseBoard(`
    r........
    .........
    .........
    .........
    ....b....
    .........
    .........
    .........
    .........
  `);
  const start = stateOf(board, { score: 30, cleared: 3 });

  it('spawns exactly the preview colors and draws a new preview', () => {
    const result = playTurn(start, at(0, 0), at(0, 3), createRng(5));
    if (result.status !== 'played') throw new Error('expected a played turn');
    expect(result.events.map((event) => event.type)).toEqual(['move', 'spawn']);
    const spawn = result.events[1];
    if (spawn?.type !== 'spawn') throw new Error('expected a spawn');
    expect(spawn.colors).toEqual(PREVIEW);
    expect(new Set(spawn.cells.map((c) => `${c.row},${c.col}`)).size).toBe(3);
    spawn.cells.forEach((cell, i) => {
      expect(board[cell.row * 9 + cell.col]).toBeNull();
      expect(result.state.board[cell.row * 9 + cell.col]).toBe(PREVIEW[i]);
    });
    expect(balls(result.state.board)).toBe(5);
    expect(result.state.preview).toHaveLength(SPAWN_COUNT);
    expect(result.state).toMatchObject({ score: 30, cleared: 3, gameOver: false });
  });

  it('is repeatable for the same seed and leaves the input state alone', () => {
    const copy = JSON.parse(JSON.stringify(start));
    expect(playTurn(start, at(0, 0), at(0, 3), createRng(5))).toEqual(
      playTurn(start, at(0, 0), at(0, 3), createRng(5)),
    );
    expect(start).toEqual(copy);
  });
});

describe('playTurn: spawns that clear', () => {
  it('clears a line completed by a new ball and adds no replacements', () => {
    // Holes at (0, 4) and (3, 0); the ball on (3, 1) steps into (3, 0), so
    // both holes get green, and the one on (0, 4) completes the top row.
    let board = crowded([at(0, 4), at(3, 0)]);
    for (let col = 0; col < 4; col++) board = setBall(board, at(0, col), 'green');
    board = setBall(board, at(0, 5), 'red');
    const start = stateOf(board, { preview: ['green', 'green', 'green'] });
    const result = playTurn(start, at(3, 1), at(3, 0), createRng(2));
    if (result.status !== 'played') throw new Error('expected a played turn');
    expect(result.events.map((event) => event.type)).toEqual(['move', 'spawn', 'clear']);
    const clear = result.events[2];
    if (clear?.type !== 'clear') throw new Error('expected a clear');
    expect(clear.cells).toEqual(expect.arrayContaining([0, 1, 2, 3, 4].map((col) => at(0, col))));
    expect(clear.points).toBe(clear.cells.length * 10);
    expect(result.state.score).toBe(clear.points);
    expect(result.state.cleared).toBe(clear.cells.length);
    expect(findAllLines(result.state.board)).toEqual([]);
    // Only the cleared squares are empty: no replacement balls, no game over.
    expect(emptyCells(result.state.board)).toHaveLength(clear.cells.length);
    expect(result.state.gameOver).toBe(false);
  });
});

describe('playTurn: few free squares', () => {
  it('fills only the 2 free squares and checks only those', () => {
    // Holes at (0, 0) and (4, 4); the ball on (0, 1) steps into (0, 0).
    const start = stateOf(crowded([at(0, 0), at(4, 4)]));
    const result = playTurn(start, at(0, 1), at(0, 0), createRng(9));
    if (result.status !== 'played') throw new Error('expected a played turn');
    const spawn = result.events.find((event) => event.type === 'spawn');
    if (spawn?.type !== 'spawn') throw new Error('expected a spawn');
    expect(spawn.cells).toHaveLength(2);
    expect(spawn.colors).toEqual(PREVIEW.slice(0, 2));
    expect(result.state.preview).toHaveLength(SPAWN_COUNT);
    expect(emptyCells(result.state.board)).toEqual([]);
    expect(result.state.gameOver).toBe(true);
  });

  it('fills the single free square and ends the game on a full board', () => {
    const start = stateOf(crowded([at(0, 0)]), { score: 40 });
    const result = playTurn(start, at(0, 1), at(0, 0), createRng(4));
    if (result.status !== 'played') throw new Error('expected a played turn');
    expect(result.events.map((event) => event.type)).toEqual(['move', 'spawn', 'gameOver']);
    expect(result.events[1]).toEqual({ type: 'spawn', cells: [at(0, 1)], colors: ['green'] });
    expect(result.state.gameOver).toBe(true);
    expect(result.state.score).toBe(40);
    expect(() => playTurn(result.state, at(0, 0), at(0, 1), createRng(1))).toThrow();
  });

  it('does not end the game when a spawn on a full board clears a line', () => {
    // The ball on (1, 4) steps up into the only hole; green then fills (1, 4)
    // and completes column 4 from row 1 to row 5.
    let board = crowded([at(0, 4)]);
    for (let row = 1; row <= 5; row++) board = setBall(board, at(row, 4), 'green');
    board = setBall(board, at(6, 4), 'red');
    board = setBall(board, at(1, 4), 'yellow');
    board = setBall(board, at(0, 3), 'orange');
    board = setBall(board, at(0, 5), 'blue');
    const result = playTurn(stateOf(board), at(1, 4), at(0, 4), createRng(1));
    if (result.status !== 'played') throw new Error('expected a played turn');
    expect(result.events.map((event) => event.type)).toEqual(['move', 'spawn', 'clear']);
    expect(result.state.gameOver).toBe(false);
  });
});

describe('serialize and deserialize', () => {
  it('round-trips every field', () => {
    const state: GameState = {
      board: setBall(
        setBall(parseBoard('.........\n'.repeat(9)), at(2, 3), 'blue'),
        at(8, 8),
        'red',
      ),
      preview: ['purple', 'yellow', 'orange'],
      score: 1240,
      cleared: 124,
      gameOver: false,
    };
    expect(deserialize(serialize(state))).toEqual(state);
    const over: GameState = { ...state, board: state.board.map(() => 'green'), gameOver: true };
    expect(deserialize(serialize(over))).toEqual(over);
    const fresh = newGame(createRng(11));
    expect(deserialize(serialize(fresh))).toEqual(fresh);
  });

  it('rejects text that is not a saved game', () => {
    const good = JSON.parse(serialize(newGame(createRng(1)))) as Record<string, unknown>;
    const bad = [
      'not json',
      'null',
      '[]',
      JSON.stringify({ ...good, board: [] }),
      JSON.stringify({ ...good, board: Array.from({ length: 81 }, () => 'pink') }),
      JSON.stringify({ ...good, preview: ['red'] }),
      JSON.stringify({ ...good, preview: ['red', 'red', 'pink'] }),
      JSON.stringify({ ...good, score: -10 }),
      JSON.stringify({ ...good, cleared: 1.5 }),
      JSON.stringify({ ...good, gameOver: 'no' }),
      // Over on a board with room, or still running on a full one: no move could follow.
      JSON.stringify({ ...good, gameOver: true }),
      JSON.stringify({ ...good, board: Array.from({ length: 81 }, () => 'red'), gameOver: false }),
    ];
    for (const text of bad) expect(() => deserialize(text)).toThrow(Error);
  });
});
