import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function error(message: string): never {
  throw new Error(message)
}

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function never(_: never): never {
  throw new Error('unreachable')
}

export function run<T>(fn: () => T): T {
  return fn()
}

export function randomUUID() {
  return crypto.randomUUID()
}

export function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatTime(time: Date) {
  // 2022-01-01 00:00
  const iso = time.toISOString()
  return iso.slice(0, 16).replace('T', ' ')
}

export function nullish<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

export function inspect<T>(value: T, label?: any): T {
  if (label) console.log(label, value)
  else console.log(value)

  return value
}
