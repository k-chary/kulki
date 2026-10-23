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
