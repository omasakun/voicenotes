import { Button } from '@/components/ui/button'
import { Callout, CalloutContent, CalloutTitle } from '@/components/ui/callout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { invoke } from '@tauri-apps/api/core'
import { createSignal } from 'solid-js'

export function App() {
  const [greetMsg, setGreetMsg] = createSignal('')
  const [name, setName] = createSignal('')

  async function greet() {
    setGreetMsg(await invoke('greet', { name: name() }))
  }

  return (
    <div class='my-12 flex flex-col gap-8'>
      <Card class='mx-auto flex w-80 flex-col gap-4 p-6'>
        <form
          class='flex gap-2'
          onSubmit={(e) => {
            e.preventDefault()
            greet()
          }}>
          <Input onChange={(e) => setName(e.currentTarget.value)} placeholder='Enter a name...' />
          <Button type='submit'>Greet</Button>
        </form>

        <p>{greetMsg()}</p>
      </Card>
      <div class='mx-auto flex w-80 flex-col gap-4'>
        <Callout>
          <CalloutTitle>Default</CalloutTitle>
          <CalloutContent>Lorem ipsum dolor sit amet consectetur</CalloutContent>
        </Callout>
        <Callout variant={'success'}>
          <CalloutTitle>Success</CalloutTitle>
          <CalloutContent>Lorem ipsum dolor sit amet consectetur</CalloutContent>
        </Callout>
        <Callout variant={'warning'}>
          <CalloutTitle>Warning</CalloutTitle>
          <CalloutContent>Lorem ipsum dolor sit amet consectetur</CalloutContent>
        </Callout>
        <Callout variant={'error'}>
          <CalloutTitle>Error</CalloutTitle>
          <CalloutContent>Lorem ipsum dolor sit amet consectetur</CalloutContent>
        </Callout>
        <Callout variant={'destructive'}>
          <CalloutTitle>Destructive</CalloutTitle>
          <CalloutContent>Lorem ipsum dolor sit amet consectetur</CalloutContent>
        </Callout>
      </div>
    </div>
  )
}
