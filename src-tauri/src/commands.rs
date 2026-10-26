//! Tauri commands over the SQLite `Store`. Errors reach the frontend as
//! strings, which `TauriStorage` turns into rejected promises.

use std::sync::Mutex;

use serde_json::Value;
use tauri::State;

use crate::storage::{HighscoreEntry, InsertResult, Store};

pub type StoreState = Mutex<Store>;

fn with_store<T>(
    state: &State<StoreState>,
    f: impl FnOnce(&mut Store) -> rusqlite::Result<T>,
) -> Result<T, String> {
    let mut store = state.lock().map_err(|e| e.to_string())?;
    f(&mut store).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_highscores(
    state: State<StoreState>,
    color_count: u8,
) -> Result<Vec<HighscoreEntry>, String> {
    with_store(&state, |store| store.list_highscores(color_count))
}

#[tauri::command]
pub fn insert_highscore(
    state: State<StoreState>,
    entry: HighscoreEntry,
) -> Result<InsertResult, String> {
    with_store(&state, |store| store.insert_highscore(&entry))
}

#[tauri::command]
pub fn rename_highscore(
    state: State<StoreState>,
    id: i64,
    name: String,
) -> Result<Vec<HighscoreEntry>, String> {
    with_store(&state, |store| store.rename_highscore(id, &name))
}

#[tauri::command]
pub fn get_last_name(state: State<StoreState>) -> Result<Option<String>, String> {
    with_store(&state, |store| store.last_name())
}

#[tauri::command]
pub fn set_last_name(state: State<StoreState>, name: String) -> Result<(), String> {
    with_store(&state, |store| store.set_last_name(&name))
}

#[tauri::command]
pub fn get_last_color_count(state: State<StoreState>) -> Result<Option<u8>, String> {
    with_store(&state, |store| store.last_color_count())
}

#[tauri::command]
pub fn set_last_color_count(state: State<StoreState>, color_count: u8) -> Result<(), String> {
    with_store(&state, |store| store.set_last_color_count(color_count))
}

#[tauri::command]
pub fn get_ball_theme(state: State<StoreState>) -> Result<Option<String>, String> {
    with_store(&state, |store| store.ball_theme())
}

#[tauri::command]
pub fn set_ball_theme(state: State<StoreState>, theme: String) -> Result<(), String> {
    with_store(&state, |store| store.set_ball_theme(&theme))
}

#[tauri::command]
pub fn save_game(state: State<StoreState>, game: Value) -> Result<(), String> {
    with_store(&state, |store| store.save_game(&game))
}

#[tauri::command]
pub fn load_game(state: State<StoreState>) -> Result<Option<Value>, String> {
    with_store(&state, |store| store.load_game())
}

#[tauri::command]
pub fn delete_game(state: State<StoreState>) -> Result<(), String> {
    with_store(&state, |store| store.delete_game())
}
