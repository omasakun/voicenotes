// API に対する一対一の型付きマッピングたち

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface AudioEntry {
  path: string
  mtime: number
  size: number
  title?: string
  duration?: number
  hash?: string
}

export interface AudioCollection {
  uuid: string
  name: string
  globs: string[]
}

export function getCollections(): Promise<AudioCollection[]> {
  return invoke('get_collections')
}

export function setCollections(collections: AudioCollection[]): Promise<void> {
  return invoke('set_collections', { collections })
}

export function listenCollections(callback: (collections: AudioCollection[]) => void) {
  return listen('collections', (e) => {
    callback(e.payload as AudioCollection[])
  })
}
