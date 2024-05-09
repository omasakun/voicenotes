// ダイアログを書き換えるときにも hot reload したいので、別ファイルにした

import { createSignal } from 'solid-js'

// === modal definitions ===

export const CREATE_COLLECTION_DIALOG = Symbol()
export const EDIT_COLLECTIONS_DIALOG = Symbol()

export type DialogProps = {
  [CREATE_COLLECTION_DIALOG]: {}
  [EDIT_COLLECTIONS_DIALOG]: {}
}

// == utility ===

export type DialogType = keyof DialogProps
export type DialogData = DialogDataMap[DialogType]
type DialogDataMap = {
  [T in DialogType]: {
    type: T
    props: DialogProps[T]
  }
}

// === modal context ===

const [_dialogs, setDialogs] = createSignal<DialogData[]>([])

export const dialogs = _dialogs

export function openDialog<T extends DialogType>(type: T, props: DialogProps[T]) {
  const data: DialogData = { type, props }
  setDialogs((prev) => [...prev, data])
}

export function removeDialog(data: DialogData) {
  setDialogs((prev) => prev.filter((d) => d !== data))
}
