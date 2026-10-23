// The game controller: a pure reducer over the rules module. It holds what the
// screen needs besides the game itself: the selection, the hovered field, the
// one-off message and the "Nowa gra" dialog.
import type { PlaybackView } from './playback';
import { COLOR_NAMES } from '../components/Board/fieldLabel';
import type { CellView } from '../components/Board/Board';
import {
  type Cell,
  type Color,
  type GameState,
  type Rng,
  cellAt,
  cellIndex,
  emptyBoard,
  CELL_COUNT,
  findPath,
  getBall,
  type GameEvent,
  newGame,
  playTurn,
  sameCell,
} from '../rules';
import {
  type HighscoreEntry,
  type HighscoreRow,
  normalizeName,
  pointsMissing,
  qualifies,
  placeFor,
  rowsWithLive,
} from '../highscores/ranking';

/** A played turn whose events the screen is still animating. */
export interface Turn {
  /** The game before the move; `ControllerState.game` already holds the result. */
  readonly before: GameState;
  readonly events: readonly GameEvent[];
}

export interface ControllerState {
  /** The game after the last move, even while its animation is still playing. */
  readonly game: GameState;
  /** Set from the move until the last animation of the turn ends; the board takes no input. */
  readonly turn: Turn | null;
  /** The selected ball shakes after a click with no way to the target. */
  readonly shaking: boolean;
  readonly selected: Cell | null;
  readonly hover: Cell | null;
  /** A one-off status message; `noticeId` changes with every new one. */
  readonly notice: 'noPath' | 'loaded' | null;
  readonly noticeId: number;
  /** Turns played in this game; „Nowa gra” asks for confirmation once it is above 0. */
  readonly moves: number;
  readonly confirming: boolean;
  /** Set once the score of a finished game is saved; rings its row until the next game. */
  readonly saved: { readonly name: string; readonly place: number } | null;
}

export type ControllerAction =
  | { type: 'click'; cell: Cell }
  | { type: 'hover'; cell: Cell | null }
  | { type: 'turnDone' }
  | { type: 'shakeEnd' }
  | { type: 'clearNotice'; noticeId: number }
  | { type: 'requestNewGame' }
  | { type: 'cancelNewGame' }
  | { type: 'confirmNewGame' }
  | { type: 'scoreSaved'; name: string; place: number };

export function initialState(
  game: GameState,
  notice: ControllerState['notice'] = null,
  moves = 0,
): ControllerState {
  return {
    game,
    turn: null,
    shaking: false,
    selected: null,
    hover: null,
    notice,
    noticeId: notice ? 1 : 0,
    moves,
    confirming: false,
    saved: null,
  };
}

/** What to do with the saved game after a state change. */
export type SaveEffect = { type: 'save'; game: GameState } | { type: 'delete' };

/**
 * The save to write or drop when `prev` becomes `next`. A played turn is saved
 * as soon as the reducer has computed it, before any playback. Game over and a
 * fresh game delete the save; changes that leave the game alone touch nothing.
 */
export function saveEffect(prev: ControllerState, next: ControllerState): SaveEffect | null {
  if (next.game === prev.game) return null;
  if (next.game.gameOver || next.moves === 0) return { type: 'delete' };
  return { type: 'save', game: next.game };
}

/** True while the board takes no input: a turn is animating, a dialog is open or the game is over. */
export function isLocked(state: ControllerState): boolean {
  return state.turn !== null || state.confirming || state.game.gameOver;
}

/**
 * The turn that pops a new game's balls in. A resumed game has none: it is
 * restored without animation.
 */
export function withIntro(state: ControllerState): ControllerState {
  const cells = Array.from({ length: CELL_COUNT }, (_, index) => cellAt(index)).filter(
    (cell) => getBall(state.game.board, cell) !== null,
  );
  const colors = cells.map((cell) => getBall(state.game.board, cell) as Color);
  const before: GameState = { ...state.game, board: emptyBoard() };
  return { ...state, turn: { before, events: [{ type: 'spawn', cells, colors }] } };
}

function freshGame(state: ControllerState, rng: Rng): ControllerState {
  return { ...withIntro(initialState(newGame(rng))), noticeId: state.noticeId };
}

/**
 * True while a turn animates and a click may still select `cell`: it holds the same
 * ball before and after the turn and is not an end of the move, so it neither
 * clears, nor spawns, nor is the ball on its way.
 */
function selectableDuringTurn(state: ControllerState, cell: Cell): boolean {
  const { turn, confirming, game } = state;
  if (turn === null || confirming || game.gameOver) return false;
  const color = getBall(turn.before.board, cell);
  if (color === null || color !== getBall(game.board, cell)) return false;
  return !turn.events.some(
    (event) => event.type === 'move' && (sameCell(event.from, cell) || sameCell(event.to, cell)),
  );
}

function click(state: ControllerState, cell: Cell, rng: Rng): ControllerState {
  if (state.turn !== null) {
    // The turn plays on; another ball may be picked now but moves only once it ends.
    if (!selectableDuringTurn(state, cell)) return state;
    const same = state.selected !== null && sameCell(state.selected, cell);
    return { ...state, selected: same ? null : cell, shaking: false, notice: null };
  }
  if (isLocked(state)) return state;
  const { board } = state.game;
  const { selected } = state;

  if (getBall(board, cell) !== null) {
    // A ball: select it, switch to it, or deselect it by clicking it again.
    const same = selected !== null && sameCell(selected, cell);
    return { ...state, selected: same ? null : cell, shaking: false, notice: null };
  }
  if (selected === null) return state;

  const result = playTurn(state.game, selected, cell, rng);
  if (result.status === 'noPath') {
    return { ...state, shaking: true, notice: 'noPath', noticeId: state.noticeId + 1 };
  }
  return {
    ...state,
    game: result.state,
    turn: { before: state.game, events: result.events },
    shaking: false,
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
    case 'turnDone':
      return state.turn === null ? state : { ...state, turn: null };
    case 'shakeEnd':
      return state.shaking ? { ...state, shaking: false } : state;
    case 'clearNotice':
      return state.noticeId === action.noticeId ? { ...state, notice: null } : state;
    case 'requestNewGame':
      if (state.confirming || state.turn !== null) return state;
      // Before the first move, or after the game ended, nothing is lost.
      return state.moves > 0 && !state.game.gameOver
        ? { ...state, confirming: true, hover: null }
        : freshGame(state, rng);
    case 'cancelNewGame':
      return { ...state, confirming: false };
    case 'confirmNewGame':
      return state.confirming ? freshGame(state, rng) : state;
    case 'scoreSaved':
      return state.game.gameOver && state.saved === null
        ? { ...state, saved: { name: action.name, place: action.place } }
        : state;
  }
}

/** The text of the status line as lead, bold part and tail. */
export function statusOf(state: ControllerState): { lead: string; strong?: string; tail?: string } {
  // The line stays empty while a turn animates.
  if (state.turn !== null) return { lead: '' };
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
 * What every field shows: the balls of the playback step while a turn animates, then
 *  the selection ring, and with a ball selected the path
 * dots and target ring for a reachable hovered field, or the not-allowed look
 * for an unreachable one.
 */
export function boardView(
  state: ControllerState,
  playback?: PlaybackView,
  staggerMs = 0,
): CellView[] {
  const { board } = state.game;
  const { selected, hover } = state;
  const shown = playback?.board ?? board;
  const cells: CellView[] = Array.from({ length: CELL_COUNT }, (_, index) => ({
    color: shown[index] ?? null,
  }));
  playback?.clearing.forEach((cell) => {
    cells[cellIndex(cell)] = { ...(cells[cellIndex(cell)] as CellView), ballState: 'clearing' };
  });
  playback?.spawning.forEach((cell, i) => {
    cells[cellIndex(cell)] = {
      ...(cells[cellIndex(cell)] as CellView),
      ballState: 'spawning',
      ballDelayMs: i * staggerMs,
    };
  });
  const mark = (cell: Cell, patch: Partial<CellView>) => {
    const index = cellIndex(cell);
    cells[index] = { ...(cells[index] as CellView), ...patch };
  };

  if (selected) {
    mark(selected, { state: 'selected', ballState: state.shaking ? 'shake' : 'selected' });
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

/** The „Koniec gry” dialog in the state the finished game calls for; null while it is running. */
export type GameOverView =
  | { state: 'entry'; place: number; initialName: string }
  | { state: 'saved'; name: string; place: number }
  | { state: 'outside'; missing: number };

/**
 * Picks the game-over state: name entry when the score makes the top 30 (the field
 * prefilled with the last name used, empty on the very first game), outside the top
 * 30 with the points missing otherwise, and saved once the name is stored.
 */
export function gameOverView(
  state: ControllerState,
  highscores: readonly HighscoreEntry[],
  lastName: string | null,
): GameOverView | null {
  if (!state.game.gameOver) return null;
  if (state.saved) return { state: 'saved', ...state.saved };
  const { score } = state.game;
  if (!qualifies(score, highscores)) {
    return { state: 'outside', missing: pointsMissing(score, highscores) };
  }
  return { state: 'entry', place: placeFor(score, highscores), initialName: lastName ?? '' };
}

/**
 * The rows of the highscore list. While playing, and while the name is still to be
 * entered, „Ta gra · teraz” sits at the place the score would take; once saved the
 * list holds stored rows only, and the saved one is ringed by the list.
 */
export function highscoreRows(
  state: ControllerState,
  highscores: readonly HighscoreEntry[],
): HighscoreRow[] {
  if (state.saved) {
    return highscores.map((entry, i) => ({ kind: 'stored', place: i + 1, entry }));
  }
  return rowsWithLive(highscores, state.game.score);
}

/**
 * The row to store if the app closes while the name dialog is open: the final score
 * under the prefilled name, or „Gracz”, so a top-30 game is never lost. Null when
 * there is nothing pending.
 */
export function pendingScore(
  state: ControllerState,
  highscores: readonly HighscoreEntry[],
  lastName: string | null,
  date: string,
): HighscoreEntry | null {
  if (gameOverView(state, highscores, lastName)?.state !== 'entry') return null;
  return { name: normalizeName(lastName ?? ''), score: state.game.score, date };
}
