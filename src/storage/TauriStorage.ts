import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { isColorCount } from '../highscores/ranking';
import type { HighscoreEntry, InsertResult, Storage } from './Storage';

export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

/** `Storage` backed by the SQLite commands in `src-tauri/src/commands.rs`. */
export class TauriStorage<Game = unknown> implements Storage<Game> {
  private readonly invoke: Invoke;

  constructor(invoke: Invoke = tauriInvoke) {
    this.invoke = invoke;
  }

  listHighscores(colorCount: number): Promise<HighscoreEntry[]> {
    return this.invoke<HighscoreEntry[]>('list_highscores', { colorCount });
  }

  async insertHighscore(entry: HighscoreEntry): Promise<InsertResult> {
    const result = await this.invoke<InsertResult>('insert_highscore', { entry });
    return { place: result.place ?? null, id: result.id ?? null, highscores: result.highscores };
  }

  renameHighscore(id: number, name: string): Promise<HighscoreEntry[]> {
    return this.invoke<HighscoreEntry[]>('rename_highscore', { id, name });
  }

  async getLastName(): Promise<string | null> {
    return (await this.invoke<string | null>('get_last_name')) ?? null;
  }

  async setLastName(name: string): Promise<void> {
    await this.invoke('set_last_name', { name });
  }

  async getLastColorCount(): Promise<number | null> {
    const count = await this.invoke<number | null>('get_last_color_count');
    return isColorCount(count) ? count : null;
  }

  async setLastColorCount(colorCount: number): Promise<void> {
    await this.invoke('set_last_color_count', { colorCount });
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
