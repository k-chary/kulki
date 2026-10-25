// Kulki game rules: plain TypeScript with no UI, DOM, Tauri or I/O code.
export {
  CLASSIC_COLORS,
  COLORS,
  COLOR_COUNTS,
  DEFAULT_COLORS,
  MAX_COLORS,
  MIN_COLORS,
  type Color,
  colorsFor,
  drawColorsFor,
} from './color';
export {
  BOARD_SIZE,
  CELL_COUNT,
  type Board,
  type Cell,
  cellAt,
  cellIndex,
  emptyBoard,
  emptyCells,
  getBall,
  isFull,
  isInside,
  neighbors,
  sameCell,
  setBall,
} from './board';
export { type Rng, createRng, randomColor, randomInt, sample } from './random';
export { findPath, reachable } from './path';
export {
  MIN_LINE_LENGTH,
  POINTS_PER_BALL,
  type Line,
  findAllLines,
  findLines,
  lineCells,
  scoreFor,
} from './lines';
export {
  SPAWN_COUNT,
  START_BALLS,
  type GameEvent,
  type GameState,
  type TurnResult,
  deserialize,
  newGame,
  playTurn,
  serialize,
} from './game';
