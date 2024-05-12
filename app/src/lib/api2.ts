// API を使いやすくするための追加の関数たち

import {
  AudioCollection,
  AudioEntry,
  getCollections,
  getEntries,
  listenCollections,
  listenEntriesRemove,
  listenEntriesReset,
  listenEntriesUpdate,
} from '@/lib/api1'
import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js'

export function useCollections() {
  const [collections, setCollections] = createSignal<AudioCollection[]>([])

  // setCollections の呼び出しで unlisten するのを防ぐための createEffect
  createEffect(() => {
    getCollections().then(setCollections)
    const unlisten = listenCollections(setCollections)
    onCleanup(() => unlisten.then((fn) => fn()))
  })

  return collections
}

export function useEntries(collection_uuid: Accessor<string | undefined>) {
  const [entries, setEntries] = createSignal<AudioEntry[]>([])

  createEffect(() => {
    const uuid = collection_uuid()
    if (!uuid) {
      setEntries([])
      return
    }

    getEntries(uuid).then((entries) => setEntries(entries || []))
    const unlisten = [
      listenEntriesUpdate(uuid, (entries) => setEntries(entries)),
      listenEntriesRemove(uuid, () => setEntries([])),
      listenEntriesReset(() => setEntries([])),
    ]
    onCleanup(() => unlisten.forEach((fn) => fn.then((fn) => fn())))

    // console.log('listening entries', uuid)
    // onCleanup(() => console.log('unlistening entries', uuid))
  })

  return entries
}
