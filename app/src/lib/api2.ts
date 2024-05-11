// API を使いやすくするための追加の関数たち

import { AudioCollection, getCollections, listenCollections } from '@/lib/api1'
import { createEffect, createSignal } from 'solid-js'

export function useCollections() {
  const [collections, setCollections] = createSignal<AudioCollection[]>([])

  createEffect(() => {
    getCollections().then(setCollections)
    return listenCollections(setCollections)
  })

  return collections
}
