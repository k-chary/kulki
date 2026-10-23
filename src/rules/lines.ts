import { type Board, type Cell, CELL_COUNT, cellAt, cellIndex, getBall, isInside } from './board';
import type { Color } from './color';

/** The shortest run of same-colored balls that clears. */
export const MIN_LINE_LENGTH = 5;

/** Points for each cleared ball, with no bonus for longer or crossing lines. */
export const POINTS_PER_BALL = 10;

/** A run of MIN_LINE_LENGTH or more same-colored balls, its cells in board order. */
export interface Line {
  readonly color: Color;
  readonly cells: readonly Cell[];
}

// The four line directions, each walked forwards and backwards:
// horizontal, vertical, down-right diagonal, down-left diagonal.
const DIRECTIONS: readonly Cell[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
];

/** The whole run of `color` through `cell` along `direction`, from its first cell to its last. */
function runThrough(board: Board, cell: Cell, direction: Cell, color: Color): Cell[] {
  let start = cell;
  for (;;) {
    const before = { row: start.row - direction.row, col: start.col - direction.col };
    if (!isInside(before) || getBall(board, before) !== color) break;
    start = before;
  }
  const run: Cell[] = [];
  for (
    let current = start;
    isInside(current) && getBall(board, current) === color;
    current = { row: current.row + direction.row, col: current.col + direction.col }
  ) {
    run.push(current);
  }
  return run;
}

/**
 * Every line of MIN_LINE_LENGTH or more same-colored balls that passes through
 * at least one of `cells`: horizontal, vertical or either diagonal. A run is
 * always returned whole, however long, and only once even when several of
 * `cells` lie on it. Empty squares in `cells` are ignored.
 *
 * Lines are ordered by their first cell (row-major), then by direction
 * (horizontal, vertical, down-right, down-left), so a board always gives the
 * same result.
 */
export function findLines(board: Board, cells: readonly Cell[]): Line[] {
  const found = new Map<string, Line & { first: number; direction: number }>();
  for (const cell of cells) {
    const color = getBall(board, cell);
    if (color === null) continue;
    DIRECTIONS.forEach((direction, directionIndex) => {
      const run = runThrough(board, cell, direction, color);
      if (run.length < MIN_LINE_LENGTH) return;
      const first = cellIndex(run[0] as Cell);
      const key = `${first}:${directionIndex}`;
      if (!found.has(key)) {
        found.set(key, { color, cells: run, first, direction: directionIndex });
      }
    });
  }
  return [...found.values()]
    .sort((a, b) => a.first - b.first || a.direction - b.direction)
    .map(({ color, cells: run }) => ({ color, cells: run }));
}

/** The distinct cells of `lines` in row-major order; a ball shared by crossing lines appears once. */
export function lineCells(lines: readonly Line[]): Cell[] {
  const indexes = new Set<number>();
  for (const line of lines) {
    for (const cell of line.cells) indexes.add(cellIndex(cell));
  }
  return [...indexes].sort((a, b) => a - b).map(cellAt);
}

/** Points for clearing `cells`: POINTS_PER_BALL for each distinct ball. */
export function scoreFor(cells: readonly Cell[]): number {
  const distinct = new Set(cells.map(cellIndex));
  return distinct.size * POINTS_PER_BALL;
}

/** Every line on the board, wherever it is. */
export function findAllLines(board: Board): Line[] {
  return findLines(
    board,
    Array.from({ length: CELL_COUNT }, (_, index) => cellAt(index)),
  );
}
