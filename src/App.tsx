import { useEffect, useState } from 'react';
import { startFromSearch } from './game/testHook';
import type { GameState } from './rules';
import { GameScreen } from './screen/GameScreen';
import { MemoryStorage } from './storage/MemoryStorage';
import type { Storage } from './storage/Storage';
import { TauriStorage } from './storage/TauriStorage';
import { loadSavedGame } from './storage/resume';

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
  game: GameState | undefined;
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

  // The save is read before the first paint: nothing is drawn until it is known.
  useEffect(() => {
    let current = true;
    void loadSavedGame(storage).then((saved) => {
      if (current)
        setLaunch(saved ? { game: saved, resumed: true } : { game: start.game, resumed: false });
    });
    return () => {
      current = false;
    };
  }, [storage, start]);

  if (launch === null) return null;
  return (
    <GameScreen storage={storage} rng={start.rng} game={launch.game} resumed={launch.resumed} />
  );
}
