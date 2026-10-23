import { describe, expect, it } from 'vitest';
import {
  type Board,
  type Cell,
  CELL_COUNT,
  cellAt,
  cellIndex,
  emptyBoard,
  emptyCells,
  getBall,
  sameCell,
  setBall,
} from './board';
import { findPath, reachable } from './path';
import { createRng, randomColor } from './random';
import { parseBoard } from './testing';

const at = (row: number, col: number): Cell => ({ row, col });

/** Checks the path is a legal walk: orthogonal steps through empty squares ending on `to`. */
function expectValidPath(board: Board, from: Cell, to: Cell, path: Cell[] | null) {
  if (path === null) throw new Error('Expected a path, got null');
  expect(path.length).toBeGreaterThan(0);
  expect(path.at(-1)).toEqual(to);
  let previous = from;
  for (const cell of path) {
    expect(Math.abs(cell.row - previous.row) + Math.abs(cell.col - previous.col)).toBe(1);
    expect(getBall(board, cell)).toBeNull();
    previous = cell;
  }
}

/** Independent flood fill: steps from `from` to every reachable empty square. */
function distances(board: Board, from: Cell): Map<number, number> {
  const result = new Map<number, number>();
  let frontier = [from];
  for (let distance = 1; frontier.length > 0; distance++) {
    const next: Cell[] = [];
    for (const cell of frontier) {
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const row = cell.row + dr;
        const col = cell.col + dc;
        if (row < 0 || row > 8 || col < 0 || col > 8) continue;
        const neighbor = at(row, col);
        const index = cellIndex(neighbor);
        if (sameCell(neighbor, from) || result.has(index) || getBall(board, neighbor)) continue;
        result.set(index, distance);
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  return result;
}

describe('findPath', () => {
  it('steps straight to an adjacent target', () => {
    const board = setBall(emptyBoard(), at(4, 4), 'red');
    expect(findPath(board, at(4, 4), at(4, 5))).toEqual([at(4, 5)]);
    expect(findPath(board, at(4, 4), at(3, 4))).toEqual([at(3, 4)]);
  });

  it('goes around obstacles along a shortest path', () => {
    const board = parseBoard(`
      .........
      .........
      ...ggg...
      ...grg...
      .........
      .........
      .........
      .........
      .........
    `);
    // The ball at (3,4) is boxed in on three sides; it must leave downwards.
    const path = findPath(board, at(3, 4), at(1, 4));
    expect(path).not.toBeNull();
    expectValidPath(board, at(3, 4), at(1, 4), path);
    expect(path).toHaveLength(8);
  });

  it('never moves diagonally', () => {
    const board = setBall(emptyBoard(), at(0, 0), 'blue');
    const path = findPath(board, at(0, 0), at(1, 1));
    expect(path).toHaveLength(2);
    expectValidPath(board, at(0, 0), at(1, 1), path);
  });

  it('returns null for an occupied target or the start square', () => {
    const board = setBall(setBall(emptyBoard(), at(0, 0), 'red'), at(5, 5), 'blue');
    expect(findPath(board, at(0, 0), at(5, 5))).toBeNull();
    expect(findPath(board, at(0, 0), at(0, 0))).toBeNull();
  });

  it('returns null for a fully enclosed target', () => {
    const board = parseBoard(`
      r........
      .........
      .........
      ....b....
      ...b.b...
      ....b....
      .........
      .........
      .........
    `);
    expect(findPath(board, at(0, 0), at(4, 4))).toBeNull();
  });

  it('returns null when the moving ball is walled in', () => {
    const board = parseBoard(`
      ry.......
      y........
      .........
      .........
      .........
      .........
      .........
      .........
      .........
    `);
    expect(findPath(board, at(0, 0), at(8, 8))).toBeNull();
  });

  it('follows the longest snake path', () => {
    const board = parseBoard(`
      r........
      gggggggg.
      .........
      .gggggggg
      .........
      gggggggg.
      .........
      .gggggggg
      .........
    `);
    const path = findPath(board, at(0, 0), at(8, 8));
    expect(path).toHaveLength(48);
    expectValidPath(board, at(0, 0), at(8, 8), path);
  });

  it('breaks ties up, right, down, left', () => {
    const board = setBall(emptyBoard(), at(4, 4), 'red');
    // Up first: through (3,4) rather than (4,5).
    expect(findPath(board, at(4, 4), at(3, 5))).toEqual([at(3, 4), at(3, 5)]);
    // Right before down: through (4,5) rather than (5,4).
    expect(findPath(board, at(4, 4), at(5, 5))).toEqual([at(4, 5), at(5, 5)]);
    // Down before left: through (5,4) rather than (4,3).
    expect(findPath(board, at(4, 4), at(5, 3))).toEqual([at(5, 4), at(5, 3)]);
    // Up before left: through (3,4) rather than (4,3).
    expect(findPath(board, at(4, 4), at(3, 3))).toEqual([at(3, 4), at(3, 3)]);
  });

  it('gives the same path every time', () => {
    const board = parseBoard(`
      .........
      ..p......
      .........
      ....o....
      .........
      ......y..
      .........
      .........
      ........r
    `);
    const first = findPath(board, at(8, 8), at(0, 0));
    expect(first).toHaveLength(16);
    for (let i = 0; i < 5; i++) expect(findPath(board, at(8, 8), at(0, 0))).toEqual(first);
  });

  it('rejects cells outside the board', () => {
    expect(() => findPath(emptyBoard(), at(0, 0), at(9, 0))).toThrow(RangeError);
    expect(() => findPath(emptyBoard(), at(-1, 0), at(0, 0))).toThrow(RangeError);
  });
});

describe('reachable', () => {
  it('lists every empty square on an open board', () => {
    const board = setBall(emptyBoard(), at(4, 4), 'red');
    const cells = reachable(board, at(4, 4));
    expect(cells).toHaveLength(80);
    expect(cells).toEqual(emptyCells(board));
  });

  it('lists only the squares inside an enclosure', () => {
    const board = parseBoard(`
      .g.......
      rg.......
      gg.......
      .........
      .........
      .........
      .........
      .........
      .........
    `);
    expect(reachable(board, at(1, 0))).toEqual([at(0, 0)]);
  });

  it('is empty for a walled-in ball', () => {
    const board = parseBoard(`
      ry.......
      y........
      .........
      .........
      .........
      .........
      .........
      .........
      .........
    `);
    expect(reachable(board, at(0, 0))).toEqual([]);
  });

  it('agrees with findPath on random seeded boards', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = createRng(seed);
      const fill = 0.3 + (seed % 5) * 0.1;
      const board: Board = Array.from({ length: CELL_COUNT }, () =>
        rng() < fill ? randomColor(rng) : null,
      );
      for (let index = 0; index < CELL_COUNT; index++) {
        const from = cellAt(index);
        if (getBall(board, from) === null) continue;
        const targets = new Set(reachable(board, from).map(cellIndex));
        const expected = distances(board, from);
        expect([...targets].sort((a, b) => a - b)).toEqual(
          [...expected.keys()].sort((a, b) => a - b),
        );
        for (const to of emptyCells(board)) {
          const path = findPath(board, from, to);
          if (targets.has(cellIndex(to))) {
            expectValidPath(board, from, to, path);
            expect(path?.length).toBe(expected.get(cellIndex(to)));
          } else {
            expect(path).toBeNull();
          }
        }
      }
    }
  });
});
