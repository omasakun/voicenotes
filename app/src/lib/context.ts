import { getCurrentPage, setCurrentPage as persistCurrentPage } from '@/lib/api1'
import { useEntries } from '@/lib/api2'
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

export function useCurrentPageType() {
  // 不要な再レンダリングを防ぐために createMemo する
  return createMemo(() => {
    const page = currentPage()
    return page?.type
  })
}

export function useCurrentCollectionUuid() {
  // 不要な再レンダリングを防ぐために createMemo する
  return createMemo(() => {
    const page = currentPage()
    if (!page || page.type !== 'collection') return undefined
    return page.uuid
  })
}

export function useCurrentEntries() {
  const collectionUuid = useCurrentCollectionUuid()
  return useEntries(collectionUuid)
}

export function useCurrentEntry() {
  const entries = useCurrentEntries()

  // find は遅くなるかもしれないので、 createMemo する
  return createMemo(() => {
    const uuid = currentEntryUuid()
    return entries().find((e) => e.uuid === uuid)
  })
}
