import { describe, expect, it } from 'vitest';
import { MemoryStorage } from './MemoryStorage';
import type { BallTheme } from '../format/colors';

const entry = (name: string, score: number, colorCount = 6, bonus = false) => ({
  name,
  score,
  date: '2026-10-23T10:00:00.000Z',
  colorCount,
  bonus,
});

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

  it('renames a row by the id the insert returned, as often as asked', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Ala', 100));
    const { id } = await storage.insertHighscore(entry('Gracz', 50));
    expect(id).not.toBeNull();
    await storage.renameHighscore(id as number, '  Ola ');
    const list = await storage.renameHighscore(id as number, 'Ola');
    expect(list.map((row) => row.name)).toEqual(['Ala', 'Ola']);
    expect(await storage.renameHighscore(999, 'X')).toEqual([]);
  });

  it('returns no id for a score outside the list', async () => {
    const storage = new MemoryStorage();
    for (let i = 0; i < 30; i++) await storage.insertHighscore(entry(`G${i}`, 1000 + i));
    expect((await storage.insertHighscore(entry('Last', 10))).id).toBeNull();
  });

  it('keeps a separate top 30 per color count', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Six', 100));
    const nine = await storage.insertHighscore(entry('Nine', 50, 9));
    expect(nine.place).toBe(1);
    expect(nine.highscores.map((row) => row.name)).toEqual(['Nine']);
    expect((await storage.listHighscores(6, false)).map((row) => row.name)).toEqual(['Six']);
    expect(await storage.listHighscores(5, false)).toEqual([]);
  });

  it('trims and breaks ties within one count only', async () => {
    const storage = new MemoryStorage();
    for (let i = 0; i < 30; i++) await storage.insertHighscore(entry(`G${i}`, 1000 + i, 7));
    expect((await storage.insertHighscore(entry('Low', 1, 8))).place).toBe(1);
    expect((await storage.insertHighscore(entry('Same', 1, 8))).place).toBe(2);
    expect((await storage.insertHighscore(entry('Out', 10, 7))).place).toBeNull();
    const beat = await storage.insertHighscore(entry('Beat', 1001, 7));
    expect(beat.place).toBe(30);
    expect(await storage.listHighscores(7, false)).toHaveLength(30);
    expect(await storage.listHighscores(8, false)).toHaveLength(2);
  });

  it("renames within the list of the row's own count", async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Six', 100));
    const { id } = await storage.insertHighscore(entry('Gracz', 50, 9));
    const list = await storage.renameHighscore(id as number, 'Ola');
    expect(list.map((row) => row.name)).toEqual(['Ola']);
    expect(await storage.renameHighscore(999, 'X')).toEqual([]);
  });

  it('remembers the last color count and rejects a bad one', async () => {
    const storage = new MemoryStorage();
    expect(await storage.getLastColorCount()).toBeNull();
    await storage.setLastColorCount(8);
    expect(await storage.getLastColorCount()).toBe(8);
    await expect(storage.setLastColorCount(4)).rejects.toThrow(RangeError);
    await expect(storage.setLastColorCount(10)).rejects.toThrow(RangeError);
    expect(await storage.getLastColorCount()).toBe(8);
  });

  it('remembers the ball theme and rejects an unknown one', async () => {
    const storage = new MemoryStorage();
    expect(await storage.getBallTheme()).toBeNull();
    await storage.setBallTheme('candy');
    expect(await storage.getBallTheme()).toBe('candy');
    await storage.setBallTheme('cats');
    expect(await storage.getBallTheme()).toBe('cats');
    await storage.setBallTheme('candy');
    await expect(storage.setBallTheme('neon' as BallTheme)).rejects.toThrow(RangeError);
    expect(await storage.getBallTheme()).toBe('candy');
  });

  it('does not let callers change stored rows', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Ala', 100));
    const [first] = await storage.listHighscores(6, false);
    if (first) first.name = 'X';
    expect((await storage.listHighscores(6, false))[0]?.name).toBe('Ala');
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
    await first.setLastColorCount(7);
    await first.setBallTheme('candy');
    await first.saveGame({ n: 1 });

    const second = new MemoryStorage<{ n: number }>(shared);
    expect((await second.listHighscores(6, false)).map((row) => row.name)).toEqual(['Ala']);
    const { id } = await second.insertHighscore(entry('Gracz', 50));
    await second.renameHighscore(id as number, 'Ola');
    expect(
      (await new MemoryStorage(shared).listHighscores(6, false)).map((row) => row.name),
    ).toEqual(['Ala', 'Ola']);
    expect(await second.getLastName()).toBe('Ala');
    expect(await second.getLastColorCount()).toBe(7);
    expect(await second.getBallTheme()).toBe('candy');
    expect(await second.loadGame()).toEqual({ n: 1 });

    await second.deleteGame();
    expect(await new MemoryStorage(shared).loadGame()).toBeNull();
  });

  it('puts scores stored before color counts into the 6-color list', async () => {
    const old = JSON.stringify({
      highscores: [{ name: 'Ala', score: 100, date: 'd', id: 1 }],
      lastColorCount: 3,
    });
    const storage = new MemoryStorage({ getItem: () => old, setItem: () => undefined });
    expect(await storage.listHighscores(6, false)).toEqual([
      { name: 'Ala', score: 100, date: 'd', colorCount: 6, bonus: false },
    ]);
    expect(await storage.listHighscores(7, false)).toEqual([]);
    expect(await storage.getLastColorCount()).toBeNull();
  });

  it('puts scores stored before the bonus into the lists without it', async () => {
    const old = JSON.stringify({
      highscores: [{ name: 'Ala', score: 100, date: 'd', colorCount: 8, id: 1 }],
    });
    const storage = new MemoryStorage({ getItem: () => old, setItem: () => undefined });
    expect(await storage.listHighscores(8, true)).toEqual([]);
    expect((await storage.listHighscores(8, false)).map((row) => row.name)).toEqual(['Ala']);
  });

  it('keeps a separate top 30 per scoring', async () => {
    const storage = new MemoryStorage();
    for (let i = 0; i < 30; i++) await storage.insertHighscore(entry(`P${i}`, 100 + i));
    const bonus = await storage.insertHighscore(entry('Premia', 5000, 6, true));
    expect(bonus.place).toBe(1);
    expect(bonus.highscores.map((row) => row.name)).toEqual(['Premia']);
    const plain = await storage.listHighscores(6, false);
    expect(plain).toHaveLength(30);
    expect(plain.every((row) => !row.bonus)).toBe(true);
    expect(plain[29]?.score).toBe(100);
    // A plain score leaves the bonus list alone.
    await storage.insertHighscore(entry('Plain', 9999));
    expect((await storage.listHighscores(6, true)).map((row) => row.name)).toEqual(['Premia']);
    // Trimming the bonus list leaves the plain one alone.
    for (let i = 0; i < 30; i++) await storage.insertHighscore(entry(`B${i}`, 6000 + i, 6, true));
    const trimmed = await storage.listHighscores(6, true);
    expect(trimmed).toHaveLength(30);
    expect(trimmed.every((row) => row.bonus && row.score >= 6000)).toBe(true);
    expect(await storage.listHighscores(6, false)).toHaveLength(30);
    // Another count's bonus list is a third list.
    expect(await storage.listHighscores(7, true)).toEqual([]);
  });

  it('renames within the rows own scoring list', async () => {
    const storage = new MemoryStorage();
    await storage.insertHighscore(entry('Plain', 100));
    const { id } = await storage.insertHighscore(entry('Premia', 200, 6, true));
    const list = await storage.renameHighscore(id ?? -1, 'Nowy');
    expect(list.map((row) => [row.name, row.bonus])).toEqual([['Nowy', true]]);
    expect((await storage.listHighscores(6, false)).map((row) => row.name)).toEqual(['Plain']);
  });

  it('remembers the next game bonus across a reload', async () => {
    let saved = '';
    const shared = {
      getItem: () => saved || null,
      setItem: (_: string, v: string) => void (saved = v),
    };
    const first = new MemoryStorage(shared);
    expect(await first.getLastBonus()).toBeNull();
    await first.setLastBonus(true);
    expect(await first.getLastBonus()).toBe(true);
    expect(await new MemoryStorage(shared).getLastBonus()).toBe(true);
    await first.setLastBonus(false);
    expect(await first.getLastBonus()).toBe(false);
  });

  it('reads a stored unknown ball theme as unset', async () => {
    const stored = JSON.stringify({ ballTheme: 'neon' });
    const storage = new MemoryStorage({ getItem: () => stored, setItem: () => undefined });
    expect(await storage.getBallTheme()).toBeNull();
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
