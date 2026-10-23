import { describe, expect, it } from 'vitest';
import { emptyBoard, newGame, createRng, type GameState } from '../rules';
import { MemoryStorage } from './MemoryStorage';
import { loadSavedGame } from './resume';

describe('loadSavedGame', () => {
  it('returns null without a save', async () => {
    expect(await loadSavedGame(new MemoryStorage<GameState>())).toBeNull();
  });

  it('returns the saved game', async () => {
    const storage = new MemoryStorage<GameState>();
    const game = newGame(createRng(3));
    await storage.saveGame(game);
    expect(await loadSavedGame(storage)).toEqual(game);
  });

  it('drops a save with a wrong shape', async () => {
    const storage = new MemoryStorage<unknown>();
    await storage.saveGame({ board: emptyBoard(), score: 'x' });
    expect(await loadSavedGame(storage as MemoryStorage<GameState>)).toBeNull();
    expect(await storage.loadGame()).toBeNull();
  });
});
