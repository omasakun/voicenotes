import { getCurrentPage, setCurrentPage as persistCurrentPage } from '@/lib/api1'
import { useCollections, useEntries } from '@/lib/api2'
import { createEffect, createMemo, createSignal } from 'solid-js'

export type CurrentPage =
  | {
      type: 'welcome'
    }
  | {
      type: 'collection'
      uuid: string
    }

export const [currentPage, setCurrentPage] = createCurrentPageSignal()
export const [currentEntryUuid, setCurrentEntryUuid] = createSignal<string>()

function createCurrentPageSignal() {
  const [currentPage, setCurrentPage] = createSignal<CurrentPage>()

  // TODO: バージョンアップなどでページの構造が変わって正しくないページ名になった場合、強制的に welcome にするべき
  getCurrentPage().then((page) => {
    if (currentPage()) return // すでに設定済みの場合は何もしない
    setCurrentPage(page ? page : { type: 'welcome' })
  })

  // 1秒経ってもページが設定されない場合は welcome にする
  // TODO: ちゃんとしたエラーハンドリングとかすべきだと思う
  setTimeout(() => {
    if (!currentPage()) setCurrentPage({ type: 'welcome' })
  }, 1000)

  createEffect(() => {
    const page = currentPage()
    if (page) persistCurrentPage(page)
  })

  return [currentPage, setCurrentPage] as const
}

export function currentCollectionUuid() {
  const page = currentPage()
  if (!page || page.type !== 'collection') return undefined
  return page.uuid
}

export function useCurrentCollection() {
  const collections = useCollections()

  // find は遅くなるかもしれないので、 createMemo する
  return createMemo(() => {
    const uuid = currentCollectionUuid()
    return collections().find((c) => c.uuid === uuid)
  })
}

export function useCurrentEntry() {
  const entries = useEntries(currentCollectionUuid)

  // find は遅くなるかもしれないので、 createMemo する
  return createMemo(() => {
    const uuid = currentEntryUuid()
    return entries().find((e) => e.uuid === uuid)
  })
}
