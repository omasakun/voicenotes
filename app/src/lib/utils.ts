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
