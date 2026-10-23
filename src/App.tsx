import { useState } from 'react';
import { startFromSearch } from './game/testHook';
import type { GameState } from './rules';
import { GameScreen } from './screen/GameScreen';
import { MemoryStorage } from './storage/MemoryStorage';

/** The desktop build swaps in SQLite storage with issue #14; until then everything is in memory. */
export function App() {
  const [{ storage, start }] = useState(() => ({
    storage: new MemoryStorage<GameState>(),
    start: startFromSearch(window.location.search),
  }));
  return <GameScreen storage={storage} rng={start.rng} game={start.game} />;
}
