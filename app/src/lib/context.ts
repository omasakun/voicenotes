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

export const [currentPage, setCurrentPage] = createSignal<CurrentPage>()

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
