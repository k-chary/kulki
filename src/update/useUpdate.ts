import { useCallback, useEffect, useRef, useState } from 'react';
import type { AvailableUpdate, Updater } from './updater';

/** How often a running app looks for a newer release, after the check at launch. */
export const RECHECK_MS = 6 * 60 * 60 * 1000;

export type UpdateState =
  | { status: 'none' }
  | { status: 'available'; version: string }
  | { status: 'installing'; version: string; progress: number | null }
  | { status: 'failed'; version: string };

export interface UseUpdate {
  state: UpdateState;
  /** Downloads, installs and restarts. */
  install: () => void;
  /** Hides the banner until the next check finds a version. */
  dismiss: () => void;
}

/**
 * Looks for a newer release at launch and every `RECHECK_MS`. A failed check (offline, no
 * release yet) is silent: the game is not the place to report it. Only a failed install shows.
 */
export function useUpdate(updater: Updater | null): UseUpdate {
  const [state, setState] = useState<UpdateState>({ status: 'none' });
  const found = useRef<AvailableUpdate | null>(null);
  const dismissed = useRef<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (updater === null) return;
    let current = true;
    const look = async () => {
      if (busy.current) return;
      try {
        const update = await updater.check();
        if (!current || busy.current || update === null) return;
        found.current = update;
        if (dismissed.current !== update.version) {
          setState({ status: 'available', version: update.version });
        }
      } catch {
        // Offline or nothing published: try again at the next interval.
      }
    };
    void look();
    const timer = setInterval(() => void look(), RECHECK_MS);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [updater]);

  const install = useCallback(() => {
    const update = found.current;
    if (updater === null || update === null || busy.current) return;
    busy.current = true;
    const version = update.version;
    setState({ status: 'installing', version, progress: 0 });
    update
      .install((progress) => setState({ status: 'installing', version, progress }))
      .then(() => updater.restart())
      .catch(() => setState({ status: 'failed', version }))
      .finally(() => {
        busy.current = false;
      });
  }, [updater]);

  const dismiss = useCallback(() => {
    dismissed.current = found.current?.version ?? null;
    setState({ status: 'none' });
  }, []);

  return { state, install, dismiss };
}
