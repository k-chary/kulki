// The game controller: a pure reducer over the rules module. It holds what the
// screen needs besides the game itself: the selection, the hovered field, the
// one-off message and the "Nowa gra" dialog.
import { COLOR_NAMES } from '../components/Board/fieldLabel';
import type { CellView } from '../components/Board/Board';
import {
  type Cell,
  type Color,
  type GameState,
  type Rng,
  cellIndex,
  CELL_COUNT,
  findPath,
  getBall,
  newGame,
  playTurn,
  sameCell,
} from '../rules';

export interface ControllerState {
  readonly game: GameState;
  readonly selected: Cell | null;
  readonly hover: Cell | null;
  /** A one-off status message; `noticeId` changes with every new one. */
  readonly notice: 'noPath' | 'loaded' | null;
  readonly noticeId: number;
  /** Turns played in this game; „Nowa gra” asks for confirmation once it is above 0. */
  readonly moves: number;
  readonly confirming: boolean;
}

export type ControllerAction =
  | { type: 'click'; cell: Cell }
  | { type: 'hover'; cell: Cell | null }
  | { type: 'clearNotice'; noticeId: number }
  | { type: 'requestNewGame' }
  | { type: 'cancelNewGame' }
  | { type: 'confirmNewGame' };

export function initialState(
  game: GameState,
  notice: ControllerState['notice'] = null,
): ControllerState {
  return {
    game,
    selected: null,
    hover: null,
    notice,
    noticeId: notice ? 1 : 0,
    moves: 0,
    confirming: false,
  };
}

/** True while the board takes no input: a dialog is open or the game is over. */
export function isLocked(state: ControllerState): boolean {
  return state.confirming || state.game.gameOver;
}

function freshGame(state: ControllerState, rng: Rng): ControllerState {
  return { ...initialState(newGame(rng)), noticeId: state.noticeId };
}

function click(state: ControllerState, cell: Cell, rng: Rng): ControllerState {
  if (isLocked(state)) return state;
  const { board } = state.game;
  const { selected } = state;

  if (getBall(board, cell) !== null) {
    // A ball: select it, switch to it, or deselect it by clicking it again.
    const same = selected !== null && sameCell(selected, cell);
    return { ...state, selected: same ? null : cell, notice: null };
  }
  if (selected === null) return state;

  const result = playTurn(state.game, selected, cell, rng);
  if (result.status === 'noPath') {
    return { ...state, notice: 'noPath', noticeId: state.noticeId + 1 };
  }
  return {
    ...state,
    game: result.state,
    selected: null,
    hover: null,
    notice: null,
    moves: state.moves + 1,
  };
}

export function reduce(
  state: ControllerState,
  action: ControllerAction,
  rng: Rng,
): ControllerState {
  switch (action.type) {
    case 'click':
      return click(state, action.cell, rng);
    case 'hover':
      return isLocked(state) ? state : { ...state, hover: action.cell };
    case 'clearNotice':
      return state.noticeId === action.noticeId ? { ...state, notice: null } : state;
    case 'requestNewGame':
      if (state.confirming) return state;
      // Before the first move, or after the game ended, nothing is lost.
      return state.moves > 0 && !state.game.gameOver
        ? { ...state, confirming: true, hover: null }
        : freshGame(state, rng);
    case 'cancelNewGame':
      return { ...state, confirming: false };
    case 'confirmNewGame':
      return state.confirming ? freshGame(state, rng) : state;
  }
}

/** The text of the status line as lead, bold part and tail. */
export function statusOf(state: ControllerState): { lead: string; strong?: string; tail?: string } {
  if (state.game.gameOver) return { lead: 'Koniec gry' };
  if (state.notice === 'noPath') return { lead: 'Tam nie ma przejścia' };
  if (state.notice === 'loaded') return { lead: 'Wczytano zapisaną grę' };
  const color = selectedColor(state);
  if (color) {
    return {
      lead: 'Wybrana kulka: ',
      strong: COLOR_NAMES[color],
      tail: ' · kliknij puste pole',
    };
  }
  return { lead: 'Kliknij kulkę, aby ją wybrać' };
}

export function selectedColor(state: ControllerState): Color | null {
  return state.selected ? getBall(state.game.board, state.selected) : null;
}

/**
 * What every field shows: the selection ring, and with a ball selected the path
 * dots and target ring for a reachable hovered field, or the not-allowed look
 * for an unreachable one.
 */
export function boardView(state: ControllerState): CellView[] {
  const { board } = state.game;
  const { selected, hover } = state;
  const cells: CellView[] = Array.from({ length: CELL_COUNT }, (_, index) => ({
    color: board[index] ?? null,
  }));
  const mark = (cell: Cell, patch: Partial<CellView>) => {
    const index = cellIndex(cell);
    cells[index] = { ...(cells[index] as CellView), ...patch };
  };

  if (selected) {
    mark(selected, { state: 'selected', ballState: 'selected' });
    if (hover && !isLocked(state) && getBall(board, hover) === null) {
      const path = findPath(board, selected, hover);
      if (path) {
        path.forEach((cell, i) => mark(cell, { state: i === path.length - 1 ? 'target' : 'path' }));
      } else {
        mark(hover, { state: 'blocked' });
      }
    }
  }
  return cells;
}
