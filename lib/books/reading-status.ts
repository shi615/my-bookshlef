import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

export const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'read']

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
}

export const STATUS_COLOURS: Record<ReadingStatus, string> = {
  want_to_read: 'bg-gray-100 text-gray-700',
  reading: 'bg-blue-100 text-blue-700',
  read: 'bg-green-100 text-green-700',
}
