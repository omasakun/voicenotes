import {
  CREATE_COLLECTION_DIALOG,
  DialogData,
  EDIT_COLLECTIONS_DIALOG,
  dialogs,
  removeDialog,
} from '@/components/dialogs/context'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { never } from '@/lib/utils'
import {
  For,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  useContext,
} from 'solid-js'

import { Textarea } from '@/components/ui/textarea'
import { Dialog as DialogPrimitive } from '@kobalte/core'

const DialogContext = createContext({ remove: () => {} })

export function Dialogs() {
  createEffect(() => console.log('# of dialogs', dialogs().length))
  return (
    <For each={dialogs()}>
      {(data) => (
        <DialogContext.Provider value={{ remove: () => removeDialog(data) }}>
          {renderDialog(data)}
        </DialogContext.Provider>
      )}
    </For>
  )
}

function SmartDialog(props: DialogPrimitive.DialogRootProps & { open: boolean }) {
  const dialog = useContext(DialogContext)

  createEffect(() => {
    // フェードアウトアニメーションが終わった頃に、ダイアログリストからも削除する
    if (!props.open) setTimeout(() => dialog.remove(), 200)
  })
  return <DialogPrimitive.Root {...props} />
}

function renderDialog(data: DialogData) {
  switch (data.type) {
    case CREATE_COLLECTION_DIALOG:
      return <CreateCollectionDialog {...data.props} />
    case EDIT_COLLECTIONS_DIALOG:
      return <EditCollectionsDialog {...data.props} />
    default:
      never(data)
  }
}

function CreateCollectionDialog() {
  const [open, setOpen] = createSignal(true)
  const nameId = createUniqueId()
  const folderId = createUniqueId()
  return (
    <SmartDialog open={open()} onOpenChange={(open) => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new collection</DialogTitle>
          <DialogDescription>
            Add your existing audio folder as a audio collection to the app. All the audio files
            including subfolders will be indexed and available for playback.
          </DialogDescription>
        </DialogHeader>
        <div class='grid gap-4 py-4'>
          <div class='grid grid-cols-4 items-center gap-4'>
            <Label for={nameId} class='text-right'>
              Name
            </Label>
            <Input id={nameId} class='col-span-3' />
          </div>
          <div class='grid grid-cols-4 items-center gap-4'>
            <Label for={folderId} class='text-right'>
              Folder
            </Label>
            <Input id={folderId} class='col-span-3' />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setOpen(false)
            }}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </SmartDialog>
  )
}

function EditCollectionsDialog() {
  const [open, setOpen] = createSignal(true)
  const textId = createUniqueId()
  return (
    <SmartDialog open={open()} onOpenChange={(open) => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collections</DialogTitle>
          <DialogDescription>
            Transcriptions are associated with the content of the audio file, not the location of
            the audio file. You can change the location of the audio file without worrying about
            losing the transcription.
          </DialogDescription>
        </DialogHeader>
        <Textarea id={textId} class='py-4 font-mono' />
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              setOpen(false)
            }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpen(false)
            }}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </SmartDialog>
  )
}
