// docs: https://v2.tauri.app/develop/

use std::fs;
use std::path::PathBuf;

use futures_signals::map_ref;
use futures_signals::signal::Mutable;
use futures_signals::signal::Signal;
use futures_signals::signal::SignalExt;
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

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PersistentState {
  current_page: Option<serde_json::Value>,
  collections: Vec<AudioCollection>,
}
impl PersistentState {
  fn save(&self, path: PathBuf) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, serde_json::to_string_pretty(self).unwrap()).unwrap();
  }
  fn load(path: PathBuf) -> Option<Self> {
    let json = fs::read_to_string(path).ok()?; // file may not exist
    serde_json::from_str(&json).unwrap() // TODO: handle invalid json
  }
}

#[derive(Debug, Default)]
struct AppState {
  current_page: Mutable<Option<serde_json::Value>>,
  collections: Mutable<Vec<AudioCollection>>,
}
impl AppState {
  fn persistent_state_signal(&self) -> impl Signal<Item = PersistentState> {
    map_ref! {
      let current_page = self.current_page.signal_cloned(),
      let collections = self.collections.signal_cloned()
      => {
        PersistentState {
          current_page: current_page.clone(),
          collections: collections.clone(),
        }
      }
    }
  }
}
impl From<PersistentState> for AppState {
  fn from(state: PersistentState) -> Self {
    Self {
      current_page: Mutable::new(state.current_page),
      collections: Mutable::new(state.collections),
    }
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
      let state = PersistentState::load(get_state_path(app.handle()));
      let state = state.map_or_else(AppState::default, AppState::from);

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
        let signal = state.persistent_state_signal();
        signal.for_each(move |state| {
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
