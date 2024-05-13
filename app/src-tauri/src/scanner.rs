use std::collections::HashMap;

use chrono::{DateTime, Utc};
use globset::{Glob, GlobSet, GlobSetBuilder};
use tauri::async_runtime::spawn;
use tauri::State;
use tokio::sync::mpsc::{unbounded_channel, UnboundedSender};
use uuid::Uuid;
use walkdir::WalkDir;

use crate::state::{AppState, AudioEntry};

enum ScannerCommand {
  Scan { force: bool },
  Start,
  Stop,
}

pub struct Scanner {
  command_tx: UnboundedSender<ScannerCommand>,
}

impl Scanner {
  pub fn new(state: &AppState) -> Self {
    let (tx, mut rx) = unbounded_channel();
    let collections = state.collections.clone();
    let entries = state.entries.clone();

    // TODO: watch file system changes
    // TODO: watch collection changes

    spawn(async move {
      while let Some(command) = rx.recv().await {
        match command {
          ScannerCommand::Scan { force } => {
            println!("ScannerCommand::Scan");

            // snapshot the collections
            let collections = collections.lock_ref().clone();

            for collection in collections.iter() {
              let collection_uuid = collection.uuid.clone();
              let Ok(glob) = build_globset(&collection.globs) else {
                // TODO: propagate error to frontend
                println!("invalid glob pattern in collection: {:?}", collection);
                continue;
              };

              let walker = WalkDir::new(&collection.path)
                .into_iter()
                .filter_entry(|e| glob.is_match(e.path()));

              // ファイルサイズと更新日時が変わっていない場合、更新しない
              // そうでない場合、新しい UUID を生成して更新する
              // ファイル内容のスキャンによってハッシュが計算されたあと、
              // content-addressable storage に保存されたメタデータとの紐づけが復活する
              // TODO: それまでの間は、一時的にユーザーが編集不可能な状態になるけど、まあいいか？

              let old_entries = entries.lock_ref();
              let old_entries_lookup = old_entries
                .get(&collection_uuid)
                .map(|entries| {
                  entries
                    .iter()
                    .map(|entry| (entry.path.clone(), entry))
                    .collect::<HashMap<_, _>>()
                })
                .unwrap_or_default();

              let mut new_entries = vec![];
              for entry in walker {
                let entry = entry.unwrap();

                if !entry.file_type().is_file() {
                  continue;
                }

                let path = entry.path().to_str().unwrap().to_string();
                let mtime: DateTime<Utc> = entry.metadata().unwrap().modified().unwrap().into();
                let mtime = mtime.to_rfc3339();
                let size = entry.metadata().unwrap().len();

                if !force {
                  if let Some(&old_entry) = old_entries_lookup.get(&path) {
                    if old_entry.mtime == mtime && old_entry.size == size {
                      // unchanged. keep the old entry
                      println!("entry unchanged: {:?}", path);
                      new_entries.push(old_entry.clone());
                      continue;
                    }
                  }
                }

                let filename = entry.file_name().to_str().unwrap();
                let filename = filename.split('.').next().unwrap().to_string();

                println!("entry changed: {:?}", path);
                new_entries.push(AudioEntry {
                  uuid: Uuid::new_v4().to_string(), // maybe updated after hash calculation
                  path,
                  mtime,
                  size,
                  title: Some(filename), // TODO: extract title from metadata
                  duration: None,
                  hash: None,
                });
              }

              drop(old_entries); // or, lock_mut() will deadlock

              let mut entries = entries.lock_mut();
              entries.insert_cloned(collection_uuid, new_entries);

              println!("scanned collection: {:?}", collection.name);
            }

            println!("scan finished");
          }
          ScannerCommand::Start => {
            println!("ScannerCommand::Start");
            // TODO: start the scan
          }
          ScannerCommand::Stop => {
            println!("ScannerCommand::Stop");
            // TODO: cancel the scan
          }
        }
      }
    });

    Scanner { command_tx: tx }
  }
  pub fn start(&self) {
    self.command_tx.send(ScannerCommand::Start).unwrap();
  }
  pub fn stop(&self) {
    self.command_tx.send(ScannerCommand::Stop).unwrap();
  }
  pub fn scan(&self, force: bool) {
    self
      .command_tx
      .send(ScannerCommand::Scan { force })
      .unwrap();
  }
}

#[tauri::command]
pub fn start_scan(scanner: State<'_, Scanner>) {
  scanner.start();
}

#[tauri::command]
pub fn stop_scan(scanner: State<'_, Scanner>) {
  scanner.stop();
}

#[tauri::command]
pub fn run_scan(scanner: State<'_, Scanner>, force: bool) {
  scanner.scan(force);
}

fn build_globset(patterns: &Vec<String>) -> anyhow::Result<GlobSet> {
  let mut builder = GlobSetBuilder::new();
  for pattern in patterns {
    builder.add(Glob::new(pattern)?);
  }
  Ok(builder.build()?)
}
