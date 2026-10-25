import {
  type Board,
  type Cell,
  CELL_COUNT,
  cellAt,
  emptyBoard,
  emptyCells,
  getBall,
  isFull,
  isInside,
  setBall,
} from './board';
import {
  type Color,
  DEFAULT_COLORS,
  MAX_COLORS,
  MIN_COLORS,
  colorsFor,
  drawColorsFor,
} from './color';
import { findAllLines, findLines, lineCells, scoreFor } from './lines';
import { findPath } from './path';
import { type Rng, randomColor, sample } from './random';

/** Balls on the board in a new game. */
export const START_BALLS = 5;

/** Balls shown in the preview and placed after a move that clears nothing. */
export const SPAWN_COUNT = 3;

/** Everything that is saved: the board, the score and the colors of the next balls. */
export interface GameState {
  readonly board: Board;
  /** Colors of the next SPAWN_COUNT balls, in the order they appear. */
  readonly preview: readonly Color[];
  readonly score: number;
  /** How many colors this game uses (MIN_COLORS..MAX_COLORS); fixed for the whole game. */
  readonly colorCount: number;
  /** Balls cleared so far. */
  readonly cleared: number;
  /** True once the board is full; no further moves are accepted. */
  readonly gameOver: boolean;
}

/** One step of a turn, for the screen to play back in order. */
export type GameEvent =
  | {
      readonly type: 'move';
      readonly from: Cell;
      readonly to: Cell;
      readonly path: readonly Cell[];
    }
  | { readonly type: 'clear'; readonly cells: readonly Cell[]; readonly points: number }
  | {
      readonly type: 'spawn';
      readonly cells: readonly Cell[];
      readonly colors: readonly Color[];
    }
  | { readonly type: 'gameOver' };

/** The outcome of `playTurn`: the next state with its events, or the unchanged state. */
export type TurnResult =
  | { readonly status: 'played'; readonly state: GameState; readonly events: readonly GameEvent[] }
  | { readonly status: 'noPath'; readonly state: GameState };

function drawPreview(rng: Rng, colorCount: number): Color[] {
  const colors = drawColorsFor(colorCount);
  return Array.from({ length: SPAWN_COUNT }, () => randomColor(rng, colors));
}

/**
 * A new game: START_BALLS balls on random squares with random colors (not taken
 * from the preview), redrawn until they form no line, and a fresh preview. All
 * colors come from the game's `colorCount` colors (default 6, the classic game).
 */
export function newGame(rng: Rng, colorCount: number = DEFAULT_COLORS): GameState {
  const colors = drawColorsFor(colorCount);
  const squares = Array.from({ length: CELL_COUNT }, (_, index) => cellAt(index));
  let board: Board;
  do {
    board = sample(rng, squares, START_BALLS).reduce<Board>(
      (next, cell) => setBall(next, cell, randomColor(rng, colors)),
      emptyBoard(),
    );
  } while (findAllLines(board).length > 0);
  return {
    board,
    preview: drawPreview(rng, colorCount),
    score: 0,
    colorCount,
    cleared: 0,
    gameOver: false,
  };
}

/**
 * Plays one turn: moves the ball on `from` to the empty square `to`, clears
 * lines, and if nothing cleared places the preview balls and draws a new
 * preview. Returns the whole turn at once as ordered events:
 * move, clear; or move, spawn, then optionally clear and gameOver.
 *
 * If `from` holds no ball, `to` is occupied or unreachable, or `from` is `to`,
 * the result is `noPath` with the state untouched and `rng` unused.
 * Throws if the game is already over or a cell is outside the board.
 */
export function playTurn(state: GameState, from: Cell, to: Cell, rng: Rng): TurnResult {
  if (state.gameOver) throw new Error('The game is over');
  if (!isInside(from) || !isInside(to)) throw new RangeError('Cell is outside the board');
  const color = getBall(state.board, from);
  const path = color === null ? null : findPath(state.board, from, to);
  if (color === null || path === null) return { status: 'noPath', state };

  const events: GameEvent[] = [{ type: 'move', from, to, path }];
  let board = setBall(setBall(state.board, from, null), to, color);
  let preview = state.preview;
  let score = state.score;
  let cleared = state.cleared;

  // Clears the lines through `cells`; returns whether there were any.
  const clearLines = (cells: readonly Cell[]): boolean => {
    const lines = findLines(board, cells);
    if (lines.length === 0) return false;
    const gone = lineCells(lines);
    const points = scoreFor(gone);
    board = gone.reduce((next, cell) => setBall(next, cell, null), board);
    score += points;
    cleared += gone.length;
    events.push({ type: 'clear', cells: gone, points });
    return true;
  };

  if (!clearLines([to])) {
    // Only the free squares are filled when there are fewer than SPAWN_COUNT.
    const cells = sample(rng, emptyCells(board), Math.min(SPAWN_COUNT, emptyCells(board).length));
    const colors = preview.slice(0, cells.length);
    cells.forEach((cell, index) => {
      board = setBall(board, cell, colors[index] as Color);
    });
    preview = drawPreview(rng, state.colorCount);
    events.push({ type: 'spawn', cells, colors });
    clearLines(cells);
    if (isFull(board)) events.push({ type: 'gameOver' });
  }

  const next: GameState = {
    board,
    preview,
    score,
    colorCount: state.colorCount,
    cleared,
    gameOver: isFull(board),
  };
  return { status: 'played', state: next, events };
}

/** The state as a JSON string, for saving. */
export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// Brown took white's place as the 8th color; a save from before still says white.
function renamed(square: unknown): unknown {
  return square === 'white' ? 'brown' : square;
}

function isColorIn(colors: readonly Color[]) {
  return (value: unknown): value is Color => colors.includes(value as Color);
}

/**
 * Reads a state written by `serialize`. A save without `colorCount` is a 6-color
 * game, and white balls (from before brown replaced white) read as brown. Throws an Error if the text is not a valid saved game, including one whose
 * `gameOver` disagrees with a full board, whose count is outside MIN_COLORS..MAX_COLORS
 * or whose balls or preview use a color outside that count's set.
 */
export function deserialize(text: string): GameState {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Saved game is not valid JSON');
  }
  const { score, cleared, gameOver } = data ?? {};
  const board = Array.isArray(data?.board) ? data.board.map(renamed) : data?.board;
  const preview = Array.isArray(data?.preview) ? data.preview.map(renamed) : data?.preview;
  const colorCount = data?.colorCount === undefined ? DEFAULT_COLORS : data.colorCount;
  if (
    typeof colorCount !== 'number' ||
    !Number.isInteger(colorCount) ||
    colorCount < MIN_COLORS ||
    colorCount > MAX_COLORS
  ) {
    throw new Error('Saved game has an invalid color count');
  }
  const isColor = isColorIn(colorsFor(colorCount));
  if (
    !Array.isArray(board) ||
    board.length !== CELL_COUNT ||
    !board.every((square) => square === null || isColor(square)) ||
    !Array.isArray(preview) ||
    preview.length !== SPAWN_COUNT ||
    !preview.every(isColor) ||
    !isCount(score) ||
    !isCount(cleared) ||
    typeof gameOver !== 'boolean'
  ) {
    throw new Error('Saved game has an invalid shape');
  }
  if (gameOver !== isFull(board as Board)) {
    throw new Error('Saved game is over on a board with room, or running on a full one');
  }
  return { board: board as Board, preview, score, colorCount, cleared, gameOver };
}
