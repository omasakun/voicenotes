import {
  CREATE_COLLECTION_DIALOG,
  EDIT_COLLECTIONS_DIALOG,
  openDialog,
} from '@/components/dialogs/context'
import { Dialogs } from '@/components/dialogs/dialogs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Resizable, ResizableHandle, ResizablePanel } from '@/components/ui/resizable'
import { AudioCollection } from '@/lib/api1'
import { useCollections, useEntries } from '@/lib/api2'
import {
  CurrentPage,
  currentCollectionUuid,
  currentPage,
  setCurrentEntryUuid,
  setCurrentPage,
  useCurrentEntry,
} from '@/lib/context'
import { cn, formatDuration, formatTime, never, nullish } from '@/lib/utils'
import { getVersion } from '@tauri-apps/api/app'
import { exit } from '@tauri-apps/plugin-process'
import {
  Edit3Icon,
  EllipsisIcon,
  FolderIcon,
  FolderOpenIcon,
  MenuIcon,
  OrbitIcon,
  PlayIcon,
  PlusIcon,
} from 'lucide-solid'
import { For, Show, createResource } from 'solid-js'

export function App() {
  return (
    <div class='flex h-screen flex-col'>
      <Header />
      {mainContainer()}
      <Dialogs />
    </div>
  )
}

function mainContainer() {
  const page = currentPage()
  if (!page) return null
  switch (page.type) {
    case 'welcome':
      return <WelcomePage />
    case 'collection':
      return (
        <Resizable class='h-0 flex-1'>
          <ResizablePanel initialSize={0.25} class='w-0 min-w-48'>
            <FilesPane />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel initialSize={0.75} class='w-0'>
            <PlayerPane />
          </ResizablePanel>
        </Resizable>
      )
    default:
      never(page)
  }
}

function Header() {
  return (
    <div class='bg-card text-card-foreground flex items-center border-b p-1'>
      <AppMenu />
      <div class='mx-1 translate-y-[-1px]'>{'/'}</div>
      <CollectionDropdown />
      <div class='flex-1' />
      <Status />
    </div>
  )
}

function AppMenu() {
  const [version] = createResource(() => getVersion())
  return (
    <DropdownMenu placement='bottom-start' gutter={8}>
      <DropdownMenuTrigger
        as={(props) => <Button variant='ghost' class='flex items-center px-2' {...props} />}>
        <MenuIcon class='mr-2 size-4' />
        <h1 class='text-xs font-bold uppercase tracking-wide'>Voicenotes</h1>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setCurrentPage({ type: 'welcome' })}>
          Welcome
        </DropdownMenuItem>
        {/* <DropdownMenuItem>Commands</DropdownMenuItem> */}
        <DropdownMenuItem onSelect={() => exit()}>Quit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class='text-xs'>
          Version: {version.loading ? '...' : version() ?? 'unknown'}
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CollectionDropdown() {
  const collections = useCollections()

  const isSelected = (collection: AudioCollection) => currentCollectionUuid() === collection.uuid
  const pageName = (page: CurrentPage | undefined) => {
    if (!page) return ''
    switch (page.type) {
      case 'welcome':
        return 'Welcome'
      case 'collection':
        return collections().find((c) => c.uuid === page.uuid)?.name ?? 'Collection'
      default:
        never(page)
    }
  }

  return (
    <DropdownMenu gutter={8}>
      <DropdownMenuTrigger
        as={(props) => (
          <Button variant='ghost' class='flex min-w-24 justify-start px-2' {...props} />
        )}>
        {pageName(currentPage())}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <For each={collections()}>
          {(collection) => (
            <DropdownMenuItem
              onSelect={() => {
                setCurrentPage({ type: 'collection', uuid: collection.uuid })
                setCurrentEntryUuid(undefined)
              }}>
              {isSelected(collection) ? (
                <FolderOpenIcon class='mr-2 size-4' />
              ) : (
                <FolderIcon class='mr-2 size-4' />
              )}
              <div>{collection.name}</div>
            </DropdownMenuItem>
          )}
        </For>
        <DropdownMenuItem onSelect={() => openDialog(CREATE_COLLECTION_DIALOG, {})}>
          <PlusIcon class='mr-2 size-4' />
          New Collection
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openDialog(EDIT_COLLECTIONS_DIALOG, {})}>
          <Edit3Icon class='mr-2 size-4' />
          Edit Collections
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Status() {
  return (
    <Popover placement='bottom-end' gutter={8}>
      <PopoverTrigger
        as={(props) => <Button variant='ghost' class='flex items-center' {...props} />}>
        <OrbitIcon class='mr-2 size-4' />
        <div>Processing</div>
      </PopoverTrigger>
      <PopoverContent>
        <h2 class='mb-2 text-sm font-bold'>Current Status</h2>
        <p class='text-sm'>Transcribing audio...</p>
        <div class='mt-2 flex justify-end'>
          <Button size='sm'>Pause</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function WelcomePage() {
  return (
    <div class='flex flex-1 items-center justify-center'>
      <div class='mx-2 text-center'>
        <h1 class='text-4xl font-bold'>Welcome to Voicenotes</h1>
        <p class='mt-4 text-lg'>Start by creating a new audio collection</p>
        <Button class='mt-8' onClick={() => openDialog(CREATE_COLLECTION_DIALOG, {})}>
          Create Collection
        </Button>
      </div>
    </div>
  )
}

function FilesPane() {
  const entries = useEntries(currentCollectionUuid)
  return (
    <div class='h-full overflow-auto'>
      {/*
      <div class='bg-background sticky top-0 flex items-center justify-center border-b py-1'>
        <h2 class='text-sm'>Audios</h2>
      </div>
       */}
      <ul class='[&_li:last-child]:border-0'>
        <For each={entries()}>
          {(item) => (
            <li class='border-b'>
              <button
                class='hover:bg-accent hover:text-accent-foreground w-full px-4 py-3 text-start transition-colors'
                onClick={() => setCurrentEntryUuid(item.uuid)}>
                <div
                  class={cn(
                    'mb-1 truncate font-medium',
                    nullish(item.title) ? 'animate-pulse' : '',
                  )}>
                  {item.title ?? 'Loading...'}
                </div>
                <div class='flex flex-wrap justify-between text-sm'>
                  <div class='mr-2 text-xs font-medium tabular-nums'>
                    {nullish(item.duration) ? '' : formatDuration(item.duration)}
                  </div>
                  <div class='text-xs font-medium tabular-nums'>{formatTime(item.mtime)}</div>
                </div>
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

function PlayerPane() {
  const entry = useCurrentEntry()

  const fallback = () => (
    <div class='flex h-full items-center justify-center'>Select an audio file to play</div>
  )

  // select-text を親要素に指定することで、余白部分からでもテキスト選択ができるようになる
  // プレイヤーコントロール部分では改めて select-none を指定している
  return (
    <Show when={entry()} fallback={fallback()}>
      {(entry) => (
        <div class='h-full select-text overflow-auto'>
          <div class='mx-auto max-w-5xl'>
            <h2
              class={cn(
                'm-8 truncate text-2xl font-medium',
                nullish(entry().title) ? 'animate-pulse' : '',
              )}>
              {entry().title ?? 'Loading...'}
            </h2>
            <div class='m-8'>{'Contents '.repeat(1000)}</div>
          </div>
          <div class='sticky bottom-8 m-8'>
            <div class='bg-background mx-auto max-w-96 select-none rounded-xl border p-2 shadow-md'>
              <PlayerControls />
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}

function PlayerControls() {
  return (
    <div class='flex items-center justify-between'>
      <Button variant='ghost' size='icon-xs' class='mr-2'>
        <PlayIcon class='size-4' />
      </Button>
      <div class='mr-2 text-xs font-medium tabular-nums'>1:00:43</div>
      <Progress value={50} class='mr-2 flex-1' />
      <div class='mr-2 text-xs font-medium tabular-nums'>1:00:43</div>
      <DropdownMenu placement='top' gutter={12}>
        <DropdownMenuTrigger as={(props) => <Button variant='ghost' size='icon-xs' {...props} />}>
          <EllipsisIcon class='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <SpeedDropdownGroup />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SpeedDropdownGroup() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuGroupLabel>Speed</DropdownMenuGroupLabel>
      <DropdownMenuRadioGroup>
        <DropdownMenuRadioItem value='x0.5' class='tabular-nums'>
          x 0.5
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='x1.0' class='tabular-nums'>
          x 1.0
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='x1.2' class='tabular-nums'>
          x 1.2
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='x1.5' class='tabular-nums'>
          x 1.5
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='x2.0' class='tabular-nums'>
          x 2.0
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}
