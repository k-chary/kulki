import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { HighscoreEntry, InsertResult, Storage } from './Storage';

export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

/** `Storage` backed by the SQLite commands in `src-tauri/src/commands.rs`. */
export class TauriStorage<Game = unknown> implements Storage<Game> {
  private readonly invoke: Invoke;

  constructor(invoke: Invoke = tauriInvoke) {
    this.invoke = invoke;
  }

  listHighscores(): Promise<HighscoreEntry[]> {
    return this.invoke<HighscoreEntry[]>('list_highscores');
  }

  async insertHighscore(entry: HighscoreEntry): Promise<InsertResult> {
    const result = await this.invoke<InsertResult>('insert_highscore', { entry });
    return { place: result.place ?? null, highscores: result.highscores };
  }

  async getLastName(): Promise<string | null> {
    return (await this.invoke<string | null>('get_last_name')) ?? null;
  }

  async setLastName(name: string): Promise<void> {
    await this.invoke('set_last_name', { name });
  }

  async saveGame(game: Game): Promise<void> {
    await this.invoke('save_game', { game });
  }

  async loadGame(): Promise<Game | null> {
    return (await this.invoke<Game | null>('load_game')) ?? null;
  }

  async deleteGame(): Promise<void> {
    await this.invoke('delete_game');
  }
}
