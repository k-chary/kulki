/** An update that is newer than the running app and ready to install. */
export interface AvailableUpdate {
  version: string;
  /** Downloads and installs it; `onProgress` gets 0..1, or null while the size is unknown. */
  install(onProgress: (fraction: number | null) => void): Promise<void>;
}

/** What the update flow needs from the platform; the Tauri one is `tauriUpdater`. */
export interface Updater {
  /** The newer version, or null when the app is up to date. Rejects when the check fails. */
  check(): Promise<AvailableUpdate | null>;
  /** Starts the freshly installed version. */
  restart(): Promise<void>;
}

/** The Tauri updater plugin, loaded on first use so the browser build never touches it. */
export const tauriUpdater: Updater = {
  async check() {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (update === null) return null;
    return {
      version: update.version,
      async install(onProgress) {
        let total = 0;
        let received = 0;
        await update.downloadAndInstall((event) => {
          if (event.event === 'Started') total = event.data.contentLength ?? 0;
          else if (event.event === 'Progress') {
            received += event.data.chunkLength;
            onProgress(total > 0 ? Math.min(received / total, 1) : null);
          }
        });
      },
    };
  },
  async restart() {
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  },
};
