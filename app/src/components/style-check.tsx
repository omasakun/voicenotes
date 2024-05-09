import { Button } from '@/components/ui/button'
import { Callout, CalloutContent, CalloutTitle } from '@/components/ui/callout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function StyleCheck() {
  return (
    <div class='my-12 flex flex-col gap-8'>
      <Card class='mx-auto flex w-80 gap-2 p-6'>
        <Input placeholder='Enter a name...' />
        <Button>Greet</Button>
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
