import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_MS, playSequence } from './sequencer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function run(steps: { view: string; duration: number; expect?: number }[]) {
  const log: string[] = [];
  const sequence = playSequence(steps, {
    onStep: (view) => log.push(view),
    onDone: () => log.push('done'),
  });
  return { log, sequence };
}

describe('playSequence', () => {
  it('plays the steps in order and finishes after the last one', () => {
    const { log } = run([
      { view: 'a', duration: 40 },
      { view: 'b', duration: 300 },
    ]);
    expect(log).toEqual(['a']);
    vi.advanceTimersByTime(40);
    expect(log).toEqual(['a', 'b']);
    vi.advanceTimersByTime(299);
    expect(log).not.toContain('done');
    vi.advanceTimersByTime(1);
    expect(log).toEqual(['a', 'b', 'done']);
  });

  it('runs steps without a duration straight through', () => {
    const { log } = run([
      { view: 'a', duration: 0 },
      { view: 'b', duration: 0 },
    ]);
    expect(log).toEqual(['a', 'b', 'done']);
  });

  it('ends a step on its signals, before the fallback', () => {
    const { log, sequence } = run([
      { view: 'a', duration: 300, expect: 2 },
      { view: 'b', duration: 0 },
    ]);
    sequence.signal();
    expect(log).toEqual(['a']);
    sequence.signal();
    expect(log).toEqual(['a', 'b', 'done']);
    vi.advanceTimersByTime(1000);
    expect(log).toEqual(['a', 'b', 'done']);
  });

  it('falls back at duration + 50 ms when no animationend arrives', () => {
    const { log } = run([
      { view: 'a', duration: 300, expect: 1 },
      { view: 'b', duration: 20 },
    ]);
    vi.advanceTimersByTime(300 + FALLBACK_MS - 1);
    expect(log).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(log).toEqual(['a', 'b']);
  });

  it('does not let a signal cut a plain delay short', () => {
    const { log, sequence } = run([{ view: 'a', duration: 32 }]);
    sequence.signal();
    expect(log).toEqual(['a']);
    vi.advanceTimersByTime(32);
    expect(log).toEqual(['a', 'done']);
  });

  it('calls done exactly once, when the last step ends', () => {
    const { log, sequence } = run([{ view: 'a', duration: 100, expect: 1 }]);
    sequence.signal();
    sequence.signal();
    vi.advanceTimersByTime(1000);
    expect(log.filter((entry) => entry === 'done')).toHaveLength(1);
  });

  it('stops quietly when cancelled', () => {
    const { log, sequence } = run([
      { view: 'a', duration: 100 },
      { view: 'b', duration: 100 },
    ]);
    sequence.cancel();
    vi.advanceTimersByTime(1000);
    expect(log).toEqual(['a']);
  });
});
