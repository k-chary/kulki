import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { UpdateBanner } from './components/UpdateBanner/UpdateBanner';
import { startFromSearch } from './game/testHook';
import type { BallTheme } from './format';
import { DEFAULT_COLORS, type GameState, newGame } from './rules';
import { GameScreen } from './screen/GameScreen';
import { MemoryStorage } from './storage/MemoryStorage';
import type { Storage } from './storage/Storage';
import { TauriStorage } from './storage/TauriStorage';
import { loadSavedGame } from './storage/resume';
import { type Updater, tauriUpdater } from './update/updater';
import { useUpdate } from './update/useUpdate';

/** Only the installed app can update itself; the browser build (e2e) has no updater. */
const updater: Updater | null = '__TAURI_INTERNALS__' in window ? tauriUpdater : null;

/** SQLite through Tauri on the desktop; in the browser (e2e) memory backed by `localStorage`. */
function createStorage(): Storage<GameState> {
  if ('__TAURI_INTERNALS__' in window) return new TauriStorage<GameState>();
  try {
    return new MemoryStorage<GameState>(window.localStorage);
  } catch {
    return new MemoryStorage<GameState>();
  }
}

interface Launch {
  game: GameState;
  intro: boolean;
  resumed: boolean;
  ballTheme: BallTheme;
}

export function App() {
  const [{ storage, start }] = useState(() => {
    const start = startFromSearch(window.location.search);
    const storage = createStorage();
    for (const entry of start.highscores) void storage.insertHighscore(entry);
    return { storage, start };
  });
  const [launch, setLaunch] = useState<Launch | null>(null);
  const update = useUpdate(updater);

  // The save is read before the first paint: nothing is drawn until it is known.
  // A new game is drawn here, once, rather than in a render StrictMode repeats.
  useEffect(() => {
    let current = true;
    void Promise.all([
      loadSavedGame(storage),
      // null (none picked yet) and an unreadable setting both mean classic.
      storage.getBallTheme().catch(() => null),
    ]).then(async ([saved, savedTheme]) => {
      if (!current) return;
      const ballTheme = savedTheme ?? 'classic';
      // Set before the first paint, so candy balls never flash classic.
      document.documentElement.dataset.ballTheme = ballTheme;
      if (saved) setLaunch({ game: saved, intro: false, resumed: true, ballTheme });
      else if (start.game) setLaunch({ game: start.game, intro: false, resumed: false, ballTheme });
      else {
        // Without a save the last count played is used, 6 the very first time.
        const last = await storage.getLastColorCount().catch(() => null);
        if (!current) return;
        const colorCount = start.colorCount ?? last ?? DEFAULT_COLORS;
        setLaunch({ game: newGame(start.rng, colorCount), intro: true, resumed: false, ballTheme });
      }
    });
    return () => {
      current = false;
    };
  }, [storage, start]);

  if (launch === null) return null;
  const { state } = update;
  return (
    <div className={styles.app} data-banner={state.status !== 'none'}>
      {state.status !== 'none' && (
        <UpdateBanner
          version={state.version}
          phase={state.status}
          progress={state.status === 'installing' ? state.progress : null}
          onInstall={update.install}
          onDismiss={state.status === 'installing' ? undefined : update.dismiss}
        />
      )}
      <div className={styles.game}>
        <GameScreen
          storage={storage}
          rng={start.rng}
          game={launch.game}
          intro={launch.intro}
          resumed={launch.resumed}
          ballTheme={launch.ballTheme}
        />
      </div>
    </div>
  );
}
