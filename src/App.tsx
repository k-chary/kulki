import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { UpdateBanner } from './components/UpdateBanner/UpdateBanner';
import { startFromSearch } from './game/testHook';
import { type GameState, newGame } from './rules';
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
    void loadSavedGame(storage).then((saved) => {
      if (!current) return;
      if (saved) setLaunch({ game: saved, intro: false, resumed: true });
      else if (start.game) setLaunch({ game: start.game, intro: false, resumed: false });
      else setLaunch({ game: newGame(start.rng), intro: true, resumed: false });
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
        />
      </div>
    </div>
  );
}
