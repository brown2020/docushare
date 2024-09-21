import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export * from './cssVar'
export * from './getRenderContainer'
export * from './isCustomNodeSelected'
export * from './isTextSelected'
