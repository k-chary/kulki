import { useEffect, useState } from 'react';
import { startFromSearch } from './game/testHook';
import { type GameState, newGame } from './rules';
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
  return (
    <GameScreen
      storage={storage}
      rng={start.rng}
      game={launch.game}
      intro={launch.intro}
      resumed={launch.resumed}
    />
  );
}
