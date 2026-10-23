import type { Color } from './color';

/** The board is BOARD_SIZE × BOARD_SIZE squares. */
export const BOARD_SIZE = 9;

export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

/** A square on the board; row 0 is the top, col 0 the left. */
export interface Cell {
  readonly row: number;
  readonly col: number;
}

/** Every square in row-major order; `null` is an empty square. Never mutated. */
export type Board = readonly (Color | null)[];

export function emptyBoard(): Board {
  return Array.from({ length: CELL_COUNT }, () => null);
}

export function isInside(cell: Cell): boolean {
  return (
    Number.isInteger(cell.row) &&
    Number.isInteger(cell.col) &&
    cell.row >= 0 &&
    cell.row < BOARD_SIZE &&
    cell.col >= 0 &&
    cell.col < BOARD_SIZE
  );
}

function assertInside(cell: Cell): void {
  if (!isInside(cell)) {
    throw new RangeError(`Cell (${cell.row}, ${cell.col}) is outside the board`);
  }
}

/** Row-major index of a cell, 0 to CELL_COUNT - 1. */
export function cellIndex(cell: Cell): number {
  assertInside(cell);
  return cell.row * BOARD_SIZE + cell.col;
}

export function cellAt(index: number): Cell {
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
    throw new RangeError(`Index ${index} is outside the board`);
  }
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function getBall(board: Board, cell: Cell): Color | null {
  return board[cellIndex(cell)] ?? null;
}

/** Returns a new board with `color` (or nothing, for `null`) on `cell`. */
export function setBall(board: Board, cell: Cell, color: Color | null): Board {
  const next = board.slice();
  next[cellIndex(cell)] = color;
  return next;
}

/** Empty squares in row-major order. */
export function emptyCells(board: Board): Cell[] {
  const cells: Cell[] = [];
  board.forEach((color, index) => {
    if (color === null) cells.push(cellAt(index));
  });
  return cells;
}

export function isFull(board: Board): boolean {
  return board.every((color) => color !== null);
}

// Fixed order (up, right, down, left) so pathfinding is deterministic.
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
];

/** Orthogonal neighbors inside the board, in the order up, right, down, left. */
export function neighbors(cell: Cell): Cell[] {
  assertInside(cell);
  return STEPS.map((step) => ({ row: cell.row + step.row, col: cell.col + step.col })).filter(
    isInside,
  );
}
