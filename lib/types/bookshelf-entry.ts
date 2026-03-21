export type ReadingStatus = 'want_to_read' | 'reading' | 'read'

export interface BookshelfEntry {
  entryId: string
  isbn: string // ISBN-13 (normalised)
  readingStatus: ReadingStatus
  dateAdded: Date
  updatedAt: Date
  notes: string
  titleOverride?: string
  authorsOverride?: string[]
  coverImageUrlOverride?: string
}

export interface CreateBookshelfEntryInput {
  isbn: string
  notes?: string
  titleOverride?: string
  authorsOverride?: string[]
  coverImageUrlOverride?: string
  confirmDuplicate?: boolean
}

export interface DuplicateEntryError {
  type: 'duplicate'
  existingEntries: Array<{
    entryId: string
    dateAdded: Date
    readingStatus: ReadingStatus
  }>
}
