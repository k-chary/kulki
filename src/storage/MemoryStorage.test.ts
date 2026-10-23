import { describe, expect, it } from 'vitest';
import { MemoryStorage } from './MemoryStorage';

const entry = (name: string, score: number) => ({ name, score, date: '2026-10-23T10:00:00.000Z' });

describe('MemoryStorage', () => {
  it('ranks inserted scores best first and reports the place', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Ala', 100));
    const result = await storage.insertHighscore(entry('Ola', 300));
    expect(result.place).toBe(1);
    expect(result.highscores.map((row) => row.name)).toEqual(['Ola', 'Ala']);
  });

  it('keeps the older game higher on a tie', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Ala', 100));
    const result = await storage.insertHighscore(entry('Ola', 100));
    expect(result.place).toBe(2);
  });

  it('trims to 30 and returns null place for a score outside the list', async () => {
    const storage = new MemoryStorage();
    for (let i = 0; i < 30; i++) await storage.insertHighscore(entry(`G${i}`, 1000 + i));
    const result = await storage.insertHighscore(entry('Last', 10));
    expect(result.place).toBeNull();
    expect(result.highscores).toHaveLength(30);
  });

  it('round-trips the last name and the saved game', async () => {
    const storage = new MemoryStorage<{ score: number }>();
    expect(await storage.getLastName()).toBeNull();
    await storage.setLastName('Ala');
    expect(await storage.getLastName()).toBe('Ala');
    expect(await storage.loadGame()).toBeNull();
    await storage.saveGame({ score: 40 });
    expect(await storage.loadGame()).toEqual({ score: 40 });
    await storage.deleteGame();
    expect(await storage.loadGame()).toBeNull();
  });

  it('does not let callers change stored rows', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Ala', 100));
    const [first] = await storage.listHighscores();
    if (first) first.name = 'X';
    expect((await storage.listHighscores())[0]?.name).toBe('Ala');
  });
});

describe('MemoryStorage with a backing', () => {
  const backing = () => {
    const items = new Map<string, string>();
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
    };
  };

  it('survives a new instance on the same backing', async () => {
    const shared = backing();
    const first = new MemoryStorage<{ n: number }>(shared);
    await first.insertHighscore(entry('Ala', 100));
    await first.setLastName('Ala');
    await first.saveGame({ n: 1 });

    const second = new MemoryStorage<{ n: number }>(shared);
    expect((await second.listHighscores()).map((row) => row.name)).toEqual(['Ala']);
    expect(await second.getLastName()).toBe('Ala');
    expect(await second.loadGame()).toEqual({ n: 1 });

    await second.deleteGame();
    expect(await new MemoryStorage(shared).loadGame()).toBeNull();
  });

  it('ignores junk and a backing that throws', async () => {
    const junk = { getItem: () => '{nope', setItem: () => undefined };
    expect(await new MemoryStorage(junk).loadGame()).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const storage = new MemoryStorage<number>(broken);
    await storage.saveGame(2);
    expect(await storage.loadGame()).toBe(2);
  });
});
