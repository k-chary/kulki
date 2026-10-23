import { describe, expect, it } from 'vitest';
import { type GameState, createRng } from '../rules';
import { parseBoard } from '../rules/testing';
import { boardView, initialState, reduce, selectedColor, statusOf } from './controller';

const rng = createRng(1);

function game(board: string, overrides: Partial<GameState> = {}): GameState {
  return {
    board: parseBoard(board),
    preview: ['blue', 'blue', 'blue'],
    score: 0,
    cleared: 0,
    gameOver: false,
    ...overrides,
  };
}

// A red ball at 0,0, a yellow ball at 0,1 and a red wall that closes off the bottom right.
const OPEN = `
  ry.......
  .........
  .........
  .........
  .........
  .........
  .........
  .........
  .........
`;

const WALLED = `
  rg.......
  .........
  .........
  .........
  .........
  .........
  .........
  ........g
  .......gr
`;

const at = (row: number, col: number) => ({ row, col });

describe('selection', () => {
  it('selects a ball, switches to another and deselects by clicking it again', () => {
    let state = initialState(game(OPEN));
    state = reduce(state, { type: 'click', cell: at(0, 0) }, rng);
    expect(state.selected).toEqual(at(0, 0));
    state = reduce(state, { type: 'click', cell: at(0, 1) }, rng);
    expect(state.selected).toEqual(at(0, 1));
    state = reduce(state, { type: 'click', cell: at(0, 1) }, rng);
    expect(state.selected).toBeNull();
  });

  it('ignores a click on an empty field when nothing is selected', () => {
    const state = initialState(game(OPEN));
    expect(reduce(state, { type: 'click', cell: at(4, 4) }, rng)).toBe(state);
  });

  it('plays the move and clears the selection', () => {
    let state = initialState(game(OPEN));
    state = reduce(state, { type: 'click', cell: at(0, 0) }, rng);
    state = reduce(state, { type: 'click', cell: at(5, 5) }, rng);
    expect(state.selected).toBeNull();
    expect(state.moves).toBe(1);
    expect(state.game.board[5 * 9 + 5]).toBe('red');
    // Nothing cleared, so the three preview balls appeared.
    expect(state.game.board.filter((square) => square === 'blue')).toHaveLength(3);
  });
});

describe('no path', () => {
  const walled = () => {
    let state = initialState(game(WALLED));
    state = reduce(state, { type: 'click', cell: at(8, 8) }, rng);
    return reduce(state, { type: 'click', cell: at(4, 4) }, rng);
  };

  it('keeps the selection, spends no turn and shows the message', () => {
    const state = walled();
    expect(state.selected).toEqual(at(8, 8));
    expect(state.moves).toBe(0);
    expect(state.game.board).toEqual(parseBoard(WALLED));
    expect(statusOf(state)).toEqual({ lead: 'Tam nie ma przejścia' });
  });

  it('removes the message only for the notice that set it', () => {
    const state = walled();
    expect(reduce(state, { type: 'clearNotice', noticeId: state.noticeId - 1 }, rng)).toBe(state);
    const cleared = reduce(state, { type: 'clearNotice', noticeId: state.noticeId }, rng);
    expect(statusOf(cleared).lead).toBe('Wybrana kulka: ');
  });
});

describe('status line', () => {
  it('guides from selecting to moving', () => {
    let state = initialState(game(OPEN));
    expect(statusOf(state)).toEqual({ lead: 'Kliknij kulkę, aby ją wybrać' });
    state = reduce(state, { type: 'click', cell: at(0, 0) }, rng);
    expect(selectedColor(state)).toBe('red');
    expect(statusOf(state)).toEqual({
      lead: 'Wybrana kulka: ',
      strong: 'czerwona',
      tail: ' · kliknij puste pole',
    });
  });

  it('shows the loaded-game and game-over messages', () => {
    expect(statusOf(initialState(game(OPEN), 'loaded')).lead).toBe('Wczytano zapisaną grę');
    expect(statusOf(initialState(game(OPEN, { gameOver: true }))).lead).toBe('Koniec gry');
  });
});

describe('hover preview', () => {
  const selectedState = (board = OPEN) =>
    reduce(initialState(game(board)), { type: 'click', cell: at(0, 0) }, rng);

  it('shows nothing without a selection', () => {
    const state = reduce(initialState(game(OPEN)), { type: 'hover', cell: at(3, 3) }, rng);
    expect(boardView(state).every((view) => view.state === undefined)).toBe(true);
  });

  it('marks the path and the target of a reachable field', () => {
    const state = reduce(selectedState(), { type: 'hover', cell: at(2, 0) }, rng);
    const view = boardView(state);
    expect(view[0]?.state).toBe('selected');
    expect(view[9]?.state).toBe('path');
    expect(view[18]?.state).toBe('target');
  });

  it('marks an unreachable field as blocked', () => {
    let state = initialState(game(WALLED));
    state = reduce(state, { type: 'click', cell: at(8, 8) }, rng);
    state = reduce(state, { type: 'hover', cell: at(4, 4) }, rng);
    expect(boardView(state)[4 * 9 + 4]?.state).toBe('blocked');
  });

  it('does not preview over a ball', () => {
    const state = reduce(selectedState(), { type: 'hover', cell: at(0, 1) }, rng);
    expect(boardView(state)[1]?.state).toBeUndefined();
  });

  it('hides the preview when the pointer leaves', () => {
    let state = reduce(selectedState(), { type: 'hover', cell: at(2, 0) }, rng);
    state = reduce(state, { type: 'hover', cell: null }, rng);
    expect(
      boardView(state).filter((view) => view.state === 'path' || view.state === 'target'),
    ).toEqual([]);
  });
});

describe('new game', () => {
  const played = () => {
    let state = initialState(game(OPEN));
    state = reduce(state, { type: 'click', cell: at(0, 0) }, rng);
    return reduce(state, { type: 'click', cell: at(5, 5) }, rng);
  };

  it('starts at once before the first move', () => {
    const state = reduce(initialState(game(OPEN)), { type: 'requestNewGame' }, createRng(3));
    expect(state.confirming).toBe(false);
    expect(state.game.board.filter((square) => square !== null)).toHaveLength(5);
  });

  it('asks for confirmation after the first move and locks the board', () => {
    const state = reduce(played(), { type: 'requestNewGame' }, rng);
    expect(state.confirming).toBe(true);
    expect(reduce(state, { type: 'click', cell: at(0, 1) }, rng)).toBe(state);
  });

  it('keeps the game on cancel and resets it on confirm', () => {
    const asking = reduce(played(), { type: 'requestNewGame' }, rng);
    const cancelled = reduce(asking, { type: 'cancelNewGame' }, rng);
    expect(cancelled.confirming).toBe(false);
    expect(cancelled.game).toBe(asking.game);

    const fresh = reduce(asking, { type: 'confirmNewGame' }, createRng(5));
    expect(fresh.confirming).toBe(false);
    expect(fresh.moves).toBe(0);
    expect(fresh.game.score).toBe(0);
    expect(fresh.game.board.filter((square) => square !== null)).toHaveLength(5);
  });

  it('starts at once after the game ended', () => {
    const over = initialState(game(OPEN, { gameOver: true }));
    const state = reduce({ ...over, moves: 4 }, { type: 'requestNewGame' }, createRng(3));
    expect(state.confirming).toBe(false);
    expect(state.game.gameOver).toBe(false);
  });
});

describe('clearing', () => {
  it('scores 10 per ball and spawns nothing', () => {
    const board = `
      rrrr.....
      ........r
      .........
      .........
      .........
      .........
      .........
      .........
      .........
    `;
    let state = initialState(game(board));
    state = reduce(state, { type: 'click', cell: at(1, 8) }, rng);
    state = reduce(state, { type: 'click', cell: at(0, 4) }, rng);
    expect(state.game.score).toBe(50);
    expect(state.game.cleared).toBe(5);
    expect(state.game.board.every((square) => square === null)).toBe(true);
  });
});
