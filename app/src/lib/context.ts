import { createSignal } from 'solid-js'

export type CurrentPage =
  | {
      type: 'welcome'
    }
  | {
      type: 'collection'
      uuid: string
    }

export const [currentPage, setCurrentPage] = createSignal<CurrentPage>({ type: 'welcome' })
