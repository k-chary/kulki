import { describe, expect, it } from 'vitest';
import { type GameState, createRng } from '../rules';
import { parseBoard } from '../rules/testing';
import type { HighscoreEntry } from '../highscores/ranking';
import {
  boardView,
  gameOverView,
  highscoreRows,
  initialState,
  isLocked,
  pendingScore,
  reduce,
  saveEffect,
  selectedColor,
  statusOf,
  withIntro,
} from './controller';
import { restingView } from './playback';

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
    state = reduce(state, { type: 'click', cell: at(5, 5) }, rng);
    return reduce(state, { type: 'turnDone' }, rng);
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

describe('turn playback', () => {
  const start = () => {
    let state = initialState(game(OPEN));
    state = reduce(state, { type: 'click', cell: at(0, 0) }, rng);
    return reduce(state, { type: 'click', cell: at(5, 5) }, rng);
  };

  it('keeps the new game at once and locks the board until the turn is done', () => {
    const state = start();
    expect(state.turn?.before.board[0]).toBe('red');
    expect(state.turn?.events[0]?.type).toBe('move');
    expect(isLocked(state)).toBe(true);
    expect(reduce(state, { type: 'click', cell: at(0, 1) }, rng)).toBe(state);
    expect(reduce(state, { type: 'hover', cell: at(3, 3) }, rng)).toBe(state);
    expect(isLocked(reduce(state, { type: 'turnDone' }, rng))).toBe(false);
  });

  it('refuses „Nowa gra” while a turn plays and keeps the status line empty', () => {
    const state = start();
    expect(reduce(state, { type: 'requestNewGame' }, rng)).toBe(state);
    expect(statusOf(state)).toEqual({ lead: '' });
  });

  it('shakes the selected ball after a missed move until the shake ends', () => {
    let state = initialState(game(WALLED));
    state = reduce(state, { type: 'click', cell: at(8, 8) }, rng);
    state = reduce(state, { type: 'click', cell: at(4, 4) }, rng);
    expect(state.shaking).toBe(true);
    expect(boardView(state)[8 * 9 + 8]?.ballState).toBe('shake');
    state = reduce(state, { type: 'shakeEnd' }, rng);
    expect(boardView(state)[8 * 9 + 8]?.ballState).toBe('selected');
  });

  it('shows the playback step instead of the final board', () => {
    const state = start();
    const view = {
      ...restingView(game(OPEN)),
      clearing: [at(0, 1)],
      spawning: [at(0, 0)],
    };
    const cells = boardView(state, view, 60);
    expect(cells[1]?.ballState).toBe('clearing');
    expect(cells[0]).toMatchObject({ color: 'red', ballState: 'spawning', ballDelayMs: 0 });
  });
});

describe('saveEffect', () => {
  const start = initialState(game(OPEN));

  it('saves a played turn, with the state the turn produced', () => {
    const selected = reduce(start, { type: 'click', cell: { row: 0, col: 0 } }, rng);
    const moved = reduce(selected, { type: 'click', cell: { row: 2, col: 0 } }, rng);
    expect(saveEffect(selected, moved)).toEqual({ type: 'save', game: moved.game });
  });

  it('touches nothing for a selection, a refused move or a hover', () => {
    const selected = reduce(start, { type: 'click', cell: { row: 0, col: 0 } }, rng);
    const refused = reduce(
      initialState(game(WALLED)),
      { type: 'click', cell: { row: 0, col: 0 } },
      rng,
    );
    expect(saveEffect(start, selected)).toBeNull();
    expect(
      saveEffect(selected, reduce(selected, { type: 'hover', cell: { row: 1, col: 1 } }, rng)),
    ).toBeNull();
    expect(saveEffect(refused, refused)).toBeNull();
  });

  it('deletes the save when the turn ends the game', () => {
    const next = initialState(game(OPEN, { gameOver: true }), null, 5);
    expect(saveEffect(initialState(game(OPEN), null, 4), next)).toEqual({ type: 'delete' });
  });

  it('deletes the save on a confirmed new game but not while asking', () => {
    const playing = initialState(game(OPEN), null, 3);
    const asking = reduce(playing, { type: 'requestNewGame' }, rng);
    expect(saveEffect(playing, asking)).toBeNull();
    expect(saveEffect(asking, reduce(asking, { type: 'cancelNewGame' }, rng))).toBeNull();
    expect(saveEffect(asking, reduce(asking, { type: 'confirmNewGame' }, rng))).toEqual({
      type: 'delete',
    });
  });

  it('asks before discarding a resumed game', () => {
    const resumed = initialState(game(OPEN), 'loaded', 1);
    expect(reduce(resumed, { type: 'requestNewGame' }, rng).confirming).toBe(true);
    expect(statusOf(resumed).lead).toBe('Wczytano zapisaną grę');
  });
});

const stored = (score: number): HighscoreEntry => ({
  name: `Gracz ${score}`,
  score,
  date: '2026-01-15T12:00:00.000Z',
});
const top30 = Array.from({ length: 30 }, (_, i) => stored(1000 - i * 10)); // 1000 .. 710
const over = (score: number) => initialState(game(OPEN, { score, gameOver: true }));

describe('game over dialog', () => {
  it('is absent while the game runs', () => {
    expect(gameOverView(initialState(game(OPEN)), [], null)).toBeNull();
  });

  it('asks for a name when the score makes the list', () => {
    expect(gameOverView(over(800), top30, null)).toEqual({
      state: 'entry',
      place: 22,
      initialName: '',
    });
    expect(gameOverView(over(0), [], null)).toMatchObject({ state: 'entry', place: 1 });
  });

  it('prefills the last name used', () => {
    expect(gameOverView(over(800), top30, 'Ola')).toMatchObject({ initialName: 'Ola' });
  });

  it('a tie with the 30th entry does not make a full list', () => {
    expect(gameOverView(over(710), top30, null)).toEqual({ state: 'outside', missing: 1 });
  });

  it('shows the points missing to 30th place outside a full list', () => {
    expect(gameOverView(over(600), top30, null)).toEqual({ state: 'outside', missing: 111 });
  });

  it('shows the saved state after the score is stored', () => {
    const state = reduce(over(800), { type: 'scoreSaved', name: 'Ola', place: 22 }, rng);
    expect(gameOverView(state, top30, 'Ola')).toEqual({ state: 'saved', name: 'Ola', place: 22 });
  });

  it('only stores a score once, and only for a finished game', () => {
    const saved = reduce(over(800), { type: 'scoreSaved', name: 'Ola', place: 22 }, rng);
    expect(reduce(saved, { type: 'scoreSaved', name: 'Ala', place: 1 }, rng)).toBe(saved);
    const running = initialState(game(OPEN));
    expect(reduce(running, { type: 'scoreSaved', name: 'Ola', place: 1 }, rng)).toBe(running);
  });

  it('„Nowa gra” starts at once and drops the saved ring', () => {
    const saved = reduce(over(800), { type: 'scoreSaved', name: 'Ola', place: 22 }, rng);
    const next = reduce(saved, { type: 'requestNewGame' }, rng);
    expect(next.game.gameOver).toBe(false);
    expect(next.saved).toBeNull();
    expect(next.confirming).toBe(false);
  });

  it('locks the board', () => {
    const state = reduce(over(800), { type: 'click', cell: at(0, 0) }, rng);
    expect(state.selected).toBeNull();
  });
});

describe('highscore rows', () => {
  const live = (state: ReturnType<typeof initialState>, list: HighscoreEntry[]) =>
    highscoreRows(state, list).find((row) => row.kind === 'live');

  it('places „Ta gra · teraz” where the score would rank and moves it up as the score grows', () => {
    const list = [stored(300), stored(200), stored(100)];
    expect(live(initialState(game(OPEN, { score: 0 })), list)?.place).toBe(4);
    expect(live(initialState(game(OPEN, { score: 150 })), list)?.place).toBe(3);
    expect(live(initialState(game(OPEN, { score: 250 })), list)?.place).toBe(2);
    expect(live(initialState(game(OPEN, { score: 350 })), list)?.place).toBe(1);
  });

  it('is absent when the score is outside a full list, and never beyond 30 rows', () => {
    expect(live(initialState(game(OPEN, { score: 5 })), top30)).toBeUndefined();
    const inside = highscoreRows(initialState(game(OPEN, { score: 900 })), top30);
    expect(inside).toHaveLength(30);
    expect(inside.filter((row) => row.kind === 'live')).toHaveLength(1);
  });

  it('keeps the live row at the final score until the name is saved', () => {
    expect(live(over(250), [stored(300), stored(200)])?.place).toBe(2);
    expect(live(over(5), top30)).toBeUndefined();
  });

  it('holds stored rows only once saved', () => {
    const saved = reduce(over(250), { type: 'scoreSaved', name: 'Ola', place: 2 }, rng);
    const list = [stored(300), { ...stored(250), name: 'Ola' }, stored(200)];
    const rows = highscoreRows(saved, list);
    expect(rows.every((row) => row.kind === 'stored')).toBe(true);
    expect(rows.map((row) => row.place)).toEqual([1, 2, 3]);
  });
});

describe('pendingScore', () => {
  const NOW = '2026-10-23T16:00:00.000Z';

  it('is the score of a finished game whose name is still to be entered', () => {
    expect(pendingScore(over(800), top30, 'Ola', NOW)).toEqual({
      name: 'Ola',
      score: 800,
      date: NOW,
    });
  });

  it('falls back to „Gracz” without a last name', () => {
    expect(pendingScore(over(800), top30, null, NOW)?.name).toBe('Gracz');
    expect(pendingScore(over(800), [], '  ', NOW)?.name).toBe('Gracz');
  });

  it('is null while playing, once saved and outside the top 30', () => {
    expect(pendingScore(initialState(game(OPEN)), [], null, NOW)).toBeNull();
    const saved = reduce(over(800), { type: 'scoreSaved', name: 'Ola', place: 22 }, rng);
    expect(pendingScore(saved, top30, 'Ola', NOW)).toBeNull();
    expect(pendingScore(over(600), top30, 'Ola', NOW)).toBeNull();
  });
});

describe('pop-in of a new game', () => {
  it('plays the start balls in as a spawn and locks the board meanwhile', () => {
    const state = withIntro(initialState(game('rg.......\n' + '.........\n'.repeat(8))));
    expect(isLocked(state)).toBe(true);
    expect(state.turn?.before.board.every((square) => square === null)).toBe(true);
    expect(state.turn?.events).toEqual([
      { type: 'spawn', cells: [at(0, 0), at(0, 1)], colors: ['red', 'green'] },
    ]);
  });

  it('is played again after a confirmed new game but not for a resumed game', () => {
    const resumed = initialState(game(OPEN), 'loaded', 1);
    expect(resumed.turn).toBeNull();
    const asking = reduce({ ...resumed, moves: 2 }, { type: 'requestNewGame' }, rng);
    const fresh = reduce(asking, { type: 'confirmNewGame' }, createRng(5));
    expect(fresh.turn?.events[0]?.type).toBe('spawn');
  });
});
