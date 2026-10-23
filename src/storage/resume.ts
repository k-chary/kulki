import { type GameState, deserialize, serialize } from '../rules';
import type { Storage } from './Storage';

/**
 * The saved game, or null if there is none or it cannot be read. The rules
 * module owns the shape, so the stored value is checked by `deserialize`; a
 * damaged save is dropped instead of blocking the launch.
 */
export async function loadSavedGame(storage: Storage<GameState>): Promise<GameState | null> {
  try {
    const raw = await storage.loadGame();
    return raw === null ? null : deserialize(serialize(raw));
  } catch {
    await storage.deleteGame().catch(() => undefined);
    return null;
  }
}
