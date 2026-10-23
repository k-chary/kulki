import { type Board, type Cell, CELL_COUNT, cellAt, cellIndex, neighbors } from './board';

/**
 * Breadth-first search over empty squares from `from`. Returns, for each square
 * reached, the index of the square it was reached from (-1 for unreached).
 * The start square itself may hold a ball (the one being moved).
 */
function search(board: Board, from: Cell, stopAt?: number): Int16Array {
  const start = cellIndex(from);
  const previous = new Int16Array(CELL_COUNT).fill(-1);
  previous[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head] as number;
    if (current === stopAt) break;
    for (const next of neighbors(cellAt(current))) {
      const index = cellIndex(next);
      if (previous[index] === -1 && board[index] === null) {
        previous[index] = current;
        queue.push(index);
      }
    }
  }
  return previous;
}

/**
 * The shortest path a ball on `from` takes to the empty square `to`, stepping
 * up, down, left or right through empty squares only. The path lists every
 * square the ball enters, ending with `to`; `from` is not included.
 * Returns `null` if `to` is occupied or cannot be reached.
 *
 * Ties between equally short paths are broken by trying neighbors in the
 * order up, right, down, left, so the same board always gives the same path.
 */
export function findPath(board: Board, from: Cell, to: Cell): Cell[] | null {
  const start = cellIndex(from);
  const target = cellIndex(to);
  if (target === start || board[target] !== null) return null;
  const previous = search(board, from, target);
  if (previous[target] === -1) return null;
  const path: Cell[] = [];
  for (let index = target; index !== start; index = previous[index] as number) {
    path.push(cellAt(index));
  }
  return path.reverse();
}

/** Every empty square a ball on `from` can move to, in row-major order. */
export function reachable(board: Board, from: Cell): Cell[] {
  const start = cellIndex(from);
  const previous = search(board, from);
  const cells: Cell[] = [];
  previous.forEach((origin, index) => {
    if (origin !== -1 && index !== start) cells.push(cellAt(index));
  });
  return cells;
}
