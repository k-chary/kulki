import { describe, expect, it } from 'vitest';
import { startFromSearch } from './testHook';

const ROWS = ['rrrr.....', ...Array<string>(8).fill('.........')].join('/');

describe('startFromSearch', () => {
  it('is inert when the hook is disabled', () => {
    const start = startFromSearch(`?seed=1&board=${ROWS}`, false);
    expect(start.game).toBeUndefined();
  });

  it('seeds the generator', () => {
    const a = startFromSearch('?seed=7', true).rng();
    expect(startFromSearch('?seed=7', true).rng()).toBe(a);
  });

  it('builds a fixture game with its preview', () => {
    const { game } = startFromSearch(`?board=${ROWS}&preview=gbp`, true);
    expect(game?.board[0]).toBe('red');
    expect(game?.board.filter((square) => square !== null)).toHaveLength(4);
    expect(game?.preview).toEqual(['green', 'blue', 'purple']);
  });

  it('takes the color count for the game and the scores', () => {
    const start = startFromSearch(`?board=${ROWS}&colors=9&scores=500`, true);
    expect(start.game?.colorCount).toBe(9);
    expect(start.highscores[0]?.colorCount).toBe(9);
    expect(startFromSearch('?seed=1&colors=8', true).colorCount).toBe(8);
    expect(startFromSearch(`?board=${ROWS}`, true).game?.colorCount).toBe(6);
  });

  it('rejects a preview that is not three colors', () => {
    expect(() => startFromSearch(`?board=${ROWS}&preview=rg`, true)).toThrow();
  });

  it('reads stored highscores, best first', () => {
    const { highscores } = startFromSearch('?scores=900,500', true);
    expect(highscores.map((row) => [row.name, row.score])).toEqual([
      ['Gracz 1', 900],
      ['Gracz 2', 500],
    ]);
    expect(startFromSearch('?seed=1', true).highscores).toEqual([]);
    expect(startFromSearch('?scores=900', false).highscores).toEqual([]);
  });
});
