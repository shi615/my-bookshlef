import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

export const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'read']

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
}

export const STATUS_COLOURS: Record<ReadingStatus, string> = {
  want_to_read: 'bg-stone-200 text-stone-700',
  reading: 'bg-amber-100 text-amber-800',
  read: 'bg-[#dfe7d3] text-[#4f6b3a]',
}
