import { COLORS, type Color } from './color';

/** A random generator: returns a float in [0, 1), like Math.random. */
export type Rng = () => number;

/** A repeatable generator (mulberry32): the same seed always gives the same sequence. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A uniform integer in [0, max). */
export function randomInt(rng: Rng, max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError(`max must be a positive integer, got ${max}`);
  }
  return Math.floor(rng() * max);
}

export function randomColor(rng: Rng): Color {
  return COLORS[randomInt(rng, COLORS.length)] as Color;
}

/** `count` distinct items picked uniformly from `items`, in pick order. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0 || count > items.length) {
    throw new RangeError(`Cannot pick ${count} of ${items.length} items`);
  }
  const pool = items.slice();
  // Partial Fisher–Yates: the first `count` slots end up as the picks.
  for (let i = 0; i < count; i++) {
    const j = i + randomInt(rng, pool.length - i);
    [pool[i], pool[j]] = [pool[j] as T, pool[i] as T];
  }
  return pool.slice(0, count);
}
