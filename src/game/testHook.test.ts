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

  it('rejects a preview that is not three colors', () => {
    expect(() => startFromSearch(`?board=${ROWS}&preview=rg`, true)).toThrow();
  });
});
