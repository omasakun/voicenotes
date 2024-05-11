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
import { cn, never, randomUUID, run } from '@/lib/utils'
import {
  ComponentProps,
  For,
  Show,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  splitProps,
  useContext,
} from 'solid-js'

import { Textarea } from '@/components/ui/textarea'
import { getCollections, setCollections } from '@/lib/api1'
import { setCurrentPage } from '@/lib/context'
import { Dialog as DialogPrimitive } from '@kobalte/core'
import { path } from '@tauri-apps/api'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'

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

  const [error, setError] = createSignal('')
  const [processing, setProcessing] = createSignal(false)
  const nameId = createUniqueId()
  const folderId = createUniqueId()
  let nameInput!: HTMLInputElement
  let folderInput!: HTMLInputElement

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
            <Input id={nameId} class='col-span-3' ref={nameInput} />
          </div>
          <div class='grid grid-cols-4 items-center gap-4'>
            <Label for={folderId} class='text-right'>
              Folder
            </Label>
            <div class='col-span-3 flex gap-2'>
              <Input id={folderId} class='flex-1' ref={folderInput} />
              <Button
                variant='outline'
                class='flex-shrink-0'
                onClick={() => {
                  void run(async () => {
                    const dialog = await openFileDialog({ directory: true })
                    if (dialog === null) return
                    folderInput.value = dialog
                  })
                }}>
                Browse
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter class='flex items-center'>
          <ErrorText class='mr-2 text-right'>{error()}</ErrorText>
          <Button
            disabled={processing()}
            onClick={() => {
              const name = nameInput.value
              const folder = folderInput.value
              if (!name || !folder) {
                setError('Please fill in all fields')
                return
              }

              setError('')
              setProcessing(true)
              void run(async () => {
                const collections = await getCollections()
                const uuid = randomUUID()
                const glob = await path.join(folder, '**', '*')
                collections.push({ uuid, name, globs: [glob] })
                await setCollections(collections)
                setCurrentPage({ type: 'collection', uuid })
                setOpen(false)
              })
            }}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </SmartDialog>
  )
}

/** Show an error message if message is not empty */
function ErrorText(props: ComponentProps<'div'>) {
  const [, rest] = splitProps(props, ['class'])
  return (
    <Show when={props.children}>
      <div
        class={cn('text-error2-foreground animate-in fade-in font-medium', props.class)}
        {...rest}
      />
    </Show>
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
        <Textarea id={textId} class='whitespace-nowrap py-4 font-mono' />
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
