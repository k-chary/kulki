import { describe, expect, it, vi } from 'vitest';
import { TauriStorage, type Invoke } from './TauriStorage';
import type { BallTheme } from '../format/colors';

function storageReturning(value: unknown) {
  const invoke = vi.fn(() => Promise.resolve(value));
  return { storage: new TauriStorage(invoke as unknown as Invoke), invoke };
}

describe('TauriStorage', () => {
  it('lists highscores', async () => {
    const list = [{ name: 'Ala', score: 120, date: '2026-10-23T08:00:00.000Z', colorCount: 7 }];
    const { storage, invoke } = storageReturning(list);
    await expect(storage.listHighscores(7)).resolves.toEqual(list);
    expect(invoke).toHaveBeenCalledWith('list_highscores', { colorCount: 7 });
  });

  it('inserts a highscore and returns place and trimmed list', async () => {
    const entry = { name: 'Ola', score: 50, date: '2026-10-23T09:00:00.000Z', colorCount: 7 };
    const { storage, invoke } = storageReturning({ place: 2, id: 7, highscores: [entry] });
    await expect(storage.insertHighscore(entry)).resolves.toEqual({
      place: 2,
      id: 7,
      highscores: [entry],
    });
    expect(invoke).toHaveBeenCalledWith('insert_highscore', { entry });
  });

  it('renames a highscore row by id', async () => {
    const list = [{ name: 'Ola', score: 50, date: '2026-10-23T09:00:00.000Z', colorCount: 7 }];
    const { storage, invoke } = storageReturning(list);
    await expect(storage.renameHighscore(7, 'Ola')).resolves.toEqual(list);
    expect(invoke).toHaveBeenCalledWith('rename_highscore', { id: 7, name: 'Ola' });
  });

  it('maps a score that did not make the list to place null', async () => {
    const { storage } = storageReturning({ place: null, highscores: [] });
    await expect(
      storage.insertHighscore({ name: 'X', score: 0, date: '2026-10-23', colorCount: 6 }),
    ).resolves.toEqual({ place: null, id: null, highscores: [] });
  });

  it('gets and sets the last color count', async () => {
    const { storage, invoke } = storageReturning(8);
    await expect(storage.getLastColorCount()).resolves.toBe(8);
    expect(invoke).toHaveBeenCalledWith('get_last_color_count');
    await storage.setLastColorCount(5);
    expect(invoke).toHaveBeenCalledWith('set_last_color_count', { colorCount: 5 });
  });

  it('reads a missing or invalid last color count as null', async () => {
    await expect(storageReturning(null).storage.getLastColorCount()).resolves.toBeNull();
    await expect(storageReturning(12).storage.getLastColorCount()).resolves.toBeNull();
  });

  it('gets and sets the ball theme', async () => {
    const { storage, invoke } = storageReturning('candy');
    await expect(storage.getBallTheme()).resolves.toBe('candy');
    expect(invoke).toHaveBeenCalledWith('get_ball_theme');
    await storage.setBallTheme('classic');
    expect(invoke).toHaveBeenCalledWith('set_ball_theme', { theme: 'classic' });
  });

  it('reads a missing or unknown ball theme as null and refuses to set one', async () => {
    await expect(storageReturning(null).storage.getBallTheme()).resolves.toBeNull();
    await expect(storageReturning('neon').storage.getBallTheme()).resolves.toBeNull();
    const { storage, invoke } = storageReturning(undefined);
    await expect(storage.setBallTheme('neon' as BallTheme)).rejects.toThrow(RangeError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('gets and sets the last name', async () => {
    const { storage, invoke } = storageReturning('Kasia');
    await expect(storage.getLastName()).resolves.toBe('Kasia');
    expect(invoke).toHaveBeenCalledWith('get_last_name');

    await expect(storage.setLastName('Basia')).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('set_last_name', { name: 'Basia' });
  });

  it('returns null when no last name is stored', async () => {
    const { storage } = storageReturning(null);
    await expect(storage.getLastName()).resolves.toBeNull();
  });

  it('saves, loads and deletes the game', async () => {
    const game = { board: [[null, 1]], score: 10, cleared: 1, preview: [0, 2, 3] };
    const { storage, invoke } = storageReturning(game);

    await expect(storage.saveGame(game)).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('save_game', { game });

    await expect(storage.loadGame()).resolves.toEqual(game);
    expect(invoke).toHaveBeenCalledWith('load_game');

    await expect(storage.deleteGame()).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('delete_game');
  });

  it('returns null when there is no saved game', async () => {
    const { storage } = storageReturning(null);
    await expect(storage.loadGame()).resolves.toBeNull();
  });

  it('rejects when a command fails', async () => {
    const invoke = vi.fn(() => Promise.reject(new Error('database is locked')));
    const storage = new TauriStorage(invoke as unknown as Invoke);
    await expect(storage.listHighscores(6)).rejects.toThrow('database is locked');
  });
});
