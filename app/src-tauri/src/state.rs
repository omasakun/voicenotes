use std::fs;
use std::path::PathBuf;

use futures_signals::map_ref;
use futures_signals::signal::{Mutable, Signal, SignalExt};
use futures_signals::signal_map::{MapDiff, MutableBTreeMap, SignalMapExt};
use futures_signals::signal_vec::SignalVecExt;
use serde::{Deserialize, Serialize};
use tauri::async_runtime::spawn;
use tauri::{AppHandle, Manager, Runtime, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioEntry {
  pub uuid: String,
  pub path: String,
  pub mtime: String, // RFC3339
  pub size: u64,
  pub title: Option<String>,
  pub duration: Option<f64>,
  pub hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioCollection {
  pub uuid: String,
  pub name: String,
  pub path: String,
  pub globs: Vec<String>,
}

/// State that will be persisted to disk
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AppState {
  pub current_page: Mutable<Option<serde_json::Value>>,
  pub collections: Mutable<Vec<AudioCollection>>,

  /// Collection UUID -> Entries
  pub entries: MutableBTreeMap<String, Vec<AudioEntry>>,
  //
  // NOTE: Do not forget to add new fields to the `watch` method
  //
}

impl AppState {
  pub fn watch(&self) -> impl Signal<Item = ()> {
    map_ref! {
      let _ = self.current_page.signal_ref(|_| ()),
      let _ = self.collections.signal_ref(|_| ()),
      let _ = self.entries.entries_cloned().to_signal_cloned(), // TODO: is this correct?
      => {}
    }
  }
  pub fn save<R: Runtime>(&self, app: &AppHandle<R>) {
    let path = get_state_path(app);
    self.save_json(path).unwrap();
  }
  pub fn load<R: Runtime>(app: &AppHandle<R>) -> Option<Self> {
    let path = get_state_path(app);
    Self::load_json(path).ok()
  }
  pub fn save_json(&self, path: PathBuf) -> anyhow::Result<()> {
    fs::create_dir_all(path.parent().unwrap())?;
    serde_json::to_string_pretty(self)?;
    Ok(())
  }
  pub fn load_json(path: PathBuf) -> anyhow::Result<Self> {
    let json = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&json)?)
  }
  pub fn notify_collections_updates<R: Runtime>(&self, app: AppHandle<R>) {
    //! notify the frontend when the collections change
    spawn({
      let signal = self.collections.signal_cloned();
      signal.for_each(move |collections| {
        app.emit("collections", collections).unwrap();
        async {}
      })
    });
  }
  pub fn notify_entries_updates<R: Runtime>(&self, app: AppHandle<R>) {
    //! notify the frontend when the entries change
    spawn({
      let signal = self.entries.signal_map_cloned();
      signal.for_each(move |change| {
        match change {
          MapDiff::Replace { entries } => {
            app.emit("entries:reset", ()).unwrap();
            for (key, value) in entries {
              let key = format!("entries:update:{}", key);
              app.emit(&key, value).unwrap();
            }
          }
          MapDiff::Insert { key, value } => {
            let key = format!("entries:update:{}", key);
            app.emit(&key, value).unwrap();
          }
          MapDiff::Update { key, value } => {
            let key = format!("entries:update:{}", key);
            app.emit(&key, value).unwrap();
          }
          MapDiff::Remove { key } => {
            let key = format!("entries:remove:{}", key);
            app.emit(&key, ()).unwrap();
          }
          MapDiff::Clear {} => {
            app.emit("entries:reset", ()).unwrap();
          }
        }
        async {}
      })
    });
  }
}

#[tauri::command]
pub fn get_collections(state: State<'_, AppState>) -> Vec<AudioCollection> {
  state.collections.get_cloned()
}

#[tauri::command]
pub fn set_collections(state: State<'_, AppState>, collections: Vec<AudioCollection>) {
  state.collections.set(collections);
}

#[tauri::command]
pub fn get_current_page(state: State<'_, AppState>) -> Option<serde_json::Value> {
  state.current_page.get_cloned()
}

#[tauri::command]
pub fn set_current_page(state: State<'_, AppState>, page: Option<serde_json::Value>) {
  state.current_page.set(page);
}

#[tauri::command]
pub fn get_entries(state: State<'_, AppState>, uuid: &str) -> Option<Vec<AudioEntry>> {
  state.entries.lock_ref().get(uuid).cloned()
}

fn get_state_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
  app.path().app_config_dir().unwrap().join("state.json")
}
