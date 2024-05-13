// docs: https://v2.tauri.app/develop/

mod scanner;
mod state;

use futures_signals::signal::SignalExt;
use tauri::async_runtime::spawn;
use tauri::Manager;

use crate::scanner::Scanner;
use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      state::get_collections,
      state::set_collections,
      state::get_current_page,
      state::set_current_page,
      state::get_entries,
      scanner::start_scan,
      scanner::stop_scan,
      scanner::run_scan
    ])
    .setup(|app| {
      // load the state from disk
      let state = AppState::load(app.handle()).unwrap_or_default();
      let scanner = Scanner::new(&state);

      // TODO: should we notify the frontend when the current page changes?
      state.notify_collections_updates(app.handle().clone());
      state.notify_entries_updates(app.handle().clone());

      // TODO: should we watch the state file for changes?
      // persist the state to disk
      spawn({
        let app = app.handle().clone();
        let state = state.clone();
        state.watch().for_each(move |_| {
          state.save(&app);
          async {}
        })
      });

      app.manage(state);
      app.manage(scanner);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
