import { describe, expect, it } from 'vitest';
import { CLASSIC_COLORS } from './color';
import { createRng, randomColor, randomInt, sample } from './random';

const draw = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng());
};

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(draw(42, 100)).toEqual(draw(42, 100));
  });

  it('gives different sequences for different seeds', () => {
    expect(draw(1, 10)).not.toEqual(draw(2, 10));
  });

  it('returns floats in [0, 1)', () => {
    for (const value of draw(7, 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('treats seeds as 32-bit unsigned integers', () => {
    expect(draw(-1, 5)).toEqual(draw(0xffffffff, 5));
  });
});

describe('randomInt', () => {
  it('stays in [0, max) and hits every value', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const value = randomInt(rng, 9);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(9);
      seen.add(value);
    }
    expect(seen.size).toBe(9);
  });

  it('rejects a max that is not a positive integer', () => {
    const rng = createRng(1);
    expect(() => randomInt(rng, 0)).toThrow(RangeError);
    expect(() => randomInt(rng, -3)).toThrow(RangeError);
    expect(() => randomInt(rng, 2.5)).toThrow(RangeError);
  });
});

describe('randomColor', () => {
  it('draws each of the six colors about equally often', () => {
    const rng = createRng(2026);
    const counts = new Map<string, number>();
    const draws = 60_000;
    for (let i = 0; i < draws; i++) {
      const color = randomColor(rng);
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([...CLASSIC_COLORS].sort());
    for (const count of counts.values()) {
      expect(count / draws).toBeCloseTo(1 / 6, 1);
    }
  });
});

describe('sample', () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it('picks the requested number of distinct items', () => {
    const picks = sample(createRng(5), items, 7);
    expect(picks).toHaveLength(7);
    expect(new Set(picks).size).toBe(7);
    for (const pick of picks) expect(items).toContain(pick);
  });

  it('is repeatable per seed and leaves the input untouched', () => {
    const copy = items.slice();
    expect(sample(createRng(9), items, 5)).toEqual(sample(createRng(9), items, 5));
    expect(items).toEqual(copy);
  });

  it('can pick nothing or everything', () => {
    expect(sample(createRng(1), items, 0)).toEqual([]);
    expect(sample(createRng(1), items, items.length).sort((a, b) => a - b)).toEqual(items);
  });

  it('rejects impossible counts', () => {
    const rng = createRng(1);
    expect(() => sample(rng, items, 21)).toThrow(RangeError);
    expect(() => sample(rng, items, -1)).toThrow(RangeError);
    expect(() => sample(rng, items, 1.5)).toThrow(RangeError);
  });
});
