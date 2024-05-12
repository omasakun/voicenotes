import { getCurrentPage, setCurrentPage as persistCurrentPage } from '@/lib/api1'
import { createEffect, createSignal } from 'solid-js'

export type CurrentPage =
  | {
      type: 'welcome'
    }
  | {
      type: 'collection'
      uuid: string
    }

// TODO: バージョンアップなどでページの構造が変わって正しくないページ名になった場合、強制的に welcome にするべき
export const [currentPage, setCurrentPage] = createSignal<CurrentPage>()
getCurrentPage().then((page) => setCurrentPage(page ? JSON.parse(page) : { type: 'welcome' }))
createEffect(() => persistCurrentPage(JSON.stringify(currentPage())))
