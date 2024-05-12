// docs: https://v2.tauri.app/develop/

use std::fs;
use std::path::PathBuf;

use futures_signals::map_ref;
use futures_signals::signal::Mutable;
use futures_signals::signal::Signal;
use futures_signals::signal::SignalExt;
use futures_signals::signal_map::MutableBTreeMap;
use futures_signals::signal_vec::SignalVecExt;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Runtime;
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

// state that will be persisted to disk
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
struct AppState {
  current_page: Mutable<Option<serde_json::Value>>,
  collections: Mutable<Vec<AudioCollection>>,
  entries: MutableBTreeMap<String, Vec<AudioEntry>>,
  // NOTE: do not forget to add new fields to the `watch` method
}

impl AppState {
  fn watch(&self) -> impl Signal<Item = ()> {
    map_ref! {
      let _ = self.current_page.signal_ref(|_| ()),
      let _ = self.collections.signal_ref(|_| ()),
      let _ = self.entries.entries_cloned().to_signal_cloned(), // TODO: is this correct?
      => {}
    }
  }
  fn save(&self, path: PathBuf) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, serde_json::to_string_pretty(self).unwrap()).unwrap();
  }
  fn load(path: PathBuf) -> Option<Self> {
    let json = fs::read_to_string(path).ok()?; // file may not exist
    serde_json::from_str(&json).unwrap() // TODO: handle invalid json
  }
}

fn get_state_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
  app.path().app_config_dir().unwrap().join("state.json")
}

#[tauri::command]
fn get_collections(state: State<'_, AppState>) -> Vec<AudioCollection> {
  state.collections.get_cloned()
}

#[tauri::command]
fn set_collections(state: State<'_, AppState>, collections: Vec<AudioCollection>) {
  state.collections.set(collections);
}

#[tauri::command]
fn get_current_page(state: State<'_, AppState>) -> Option<serde_json::Value> {
  state.current_page.get_cloned()
}

#[tauri::command]
fn set_current_page(state: State<'_, AppState>, page: Option<serde_json::Value>) {
  state.current_page.set(page);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      get_collections,
      set_collections,
      get_current_page,
      set_current_page
    ])
    .setup(|app| {
      // load the state from disk
      let state = AppState::load(get_state_path(app.handle())).unwrap_or_default();

      // notify the frontend when the collections change
      spawn({
        let app = app.handle().clone();
        let signal = state.collections.signal_cloned();
        signal.for_each(move |collections| {
          app.emit("collections", collections).unwrap();
          async {}
        })
      });

      // TODO: should we notify the frontend when the current page changes?

      // persist the state to disk
      spawn({
        let state_path = get_state_path(app.handle());
        let signal = state.watch();
        let state = state.clone();
        signal.for_each(move |_| {
          let state = state.clone();
          let state_path = state_path.clone();
          state.save(state_path);
          async {}
        })
      });

      // TODO: should we watch the state file for changes?

      app.manage(state);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
