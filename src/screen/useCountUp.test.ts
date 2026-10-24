// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts up over the duration', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 300), {
      initialProps: { target: 0 },
    });
    rerender({ target: 100 });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(100);
  });

  it('jumps down to a lower target, as when a new game starts', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 300), {
      initialProps: { target: 840 },
    });
    rerender({ target: 0 });
    expect(result.current).toBe(0);
  });

  it('jumps when the duration is 0', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 0), {
      initialProps: { target: 0 },
    });
    rerender({ target: 50 });
    expect(result.current).toBe(50);
  });
});
