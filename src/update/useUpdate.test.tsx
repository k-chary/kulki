// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECHECK_MS, useUpdate } from './useUpdate';
import type { AvailableUpdate, Updater } from './updater';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function fakeUpdater(
  update: AvailableUpdate | null | Error,
): Updater & { restart: ReturnType<typeof vi.fn> } {
  return {
    check: vi.fn(() =>
      update instanceof Error ? Promise.reject(update) : Promise.resolve(update),
    ),
    restart: vi.fn(() => Promise.resolve()),
  };
}

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

describe('useUpdate', () => {
  it('does nothing without an updater (browser)', async () => {
    const { result } = renderHook(() => useUpdate(null));
    await flush();
    expect(result.current.state).toEqual({ status: 'none' });
  });

  it('reports a newer version found at launch', async () => {
    const updater = fakeUpdater({ version: '0.2.0', install: vi.fn() });
    const { result } = renderHook(() => useUpdate(updater));
    await flush();
    expect(result.current.state).toEqual({ status: 'available', version: '0.2.0' });
  });

  it('stays quiet when up to date or when the check fails', async () => {
    for (const outcome of [null, new Error('offline')]) {
      const { result, unmount } = renderHook(() => useUpdate(fakeUpdater(outcome)));
      await flush();
      expect(result.current.state).toEqual({ status: 'none' });
      unmount();
    }
  });

  it('installs, shows progress, then restarts', async () => {
    const install = vi.fn(async (onProgress: (f: number | null) => void) => onProgress(0.5));
    const updater = fakeUpdater({ version: '0.2.0', install });
    const { result } = renderHook(() => useUpdate(updater));
    await flush();
    act(() => result.current.install());
    await flush();
    expect(install).toHaveBeenCalledOnce();
    expect(updater.restart).toHaveBeenCalledOnce();
  });

  it('shows a failed install and allows a retry', async () => {
    const install = vi
      .fn()
      .mockRejectedValueOnce(new Error('signature'))
      .mockResolvedValueOnce(undefined);
    const updater = fakeUpdater({ version: '0.2.0', install });
    const { result } = renderHook(() => useUpdate(updater));
    await flush();
    act(() => result.current.install());
    await flush();
    expect(result.current.state).toEqual({ status: 'failed', version: '0.2.0' });
    expect(updater.restart).not.toHaveBeenCalled();
    act(() => result.current.install());
    await flush();
    expect(updater.restart).toHaveBeenCalledOnce();
  });

  it('stays dismissed for that version but checks again later', async () => {
    const updater = fakeUpdater({ version: '0.2.0', install: vi.fn() });
    const { result } = renderHook(() => useUpdate(updater));
    await flush();
    act(() => result.current.dismiss());
    expect(result.current.state).toEqual({ status: 'none' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RECHECK_MS);
    });
    expect(updater.check).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({ status: 'none' });
  });
});
