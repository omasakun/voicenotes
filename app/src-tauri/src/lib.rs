// docs: https://v2.tauri.app/develop/

use futures_signals::signal::Mutable;
use futures_signals::signal::SignalExt;
use serde::{Deserialize, Serialize};
use tauri::{async_runtime::spawn, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AudioEntry {
  path: String,
  mtime: u64,
  size: u64,
  title: Option<String>,
  duration: Option<f64>,
  hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AudioCollection {
  uuid: String,
  name: String,
  globs: Vec<String>,
}

#[derive(Debug, Default)]
struct AppState {
  collections: Mutable<Vec<AudioCollection>>,
}

#[tauri::command]
fn get_collections(state: State<'_, AppState>) -> Vec<AudioCollection> {
  state.collections.get_cloned()
}

#[tauri::command]
fn set_collections(state: State<'_, AppState>, collections: Vec<AudioCollection>) {
  state.collections.set(collections);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![get_collections, set_collections])
    .setup(|app| {
      // TODO: load latest state from disk
      let state = AppState::default();

      // notify the frontend when the collections change
      spawn({
        let app = app.handle().clone();
        let signal = state.collections.signal_cloned();
        signal.for_each(move |collections| {
          app.emit("collections", collections).unwrap();
          async {}
        })
      });

      app.manage(state);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
