mod commands;
pub mod storage;

use std::sync::Mutex;

use tauri::Manager;

use storage::Store;

/// The database file inside the app data folder.
const DATABASE_FILE: &str = "kulki.db";

/// Opens the database in the app data folder. If that folder cannot be used
/// at all, the game still runs with an in-memory store for this session.
fn open_store(app: &tauri::App) -> Store {
    let opened = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())
        .and_then(|dir| {
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            Store::open(&dir.join(DATABASE_FILE)).map_err(|e| e.to_string())
        });
    opened.unwrap_or_else(|error| {
        eprintln!("Kulki: cannot open the database ({error}), using memory only");
        Store::open_in_memory().expect("in-memory SQLite is always available")
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    // A second launch focuses the running window instead of opening another
    // one on the same database. It must be the first plugin.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));
    let builder = builder
        // Remembers the window's size and position between launches.
        .plugin(tauri_plugin_window_state::Builder::default().build());
    // Looks for a newer GitHub Release (the frontend decides when to ask and shows the
    // banner) and restarts the app once the update is installed.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());
    builder
        .setup(|app| {
            let store = open_store(app);
            app.manage(Mutex::new(store));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_highscores,
            commands::insert_highscore,
            commands::rename_highscore,
            commands::get_last_name,
            commands::set_last_name,
            commands::save_game,
            commands::load_game,
            commands::delete_game,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kulki");
}
