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

/**
 * A bookshelf entry enriched with book metadata, shaped for rendering.
 * `dateAdded` is an ISO string so it can be passed from a server component
 * to a client component without serialisation issues.
 */
export interface ShelfEntryView {
  entryId: string
  isbn: string
  readingStatus: ReadingStatus
  dateAdded: string // ISO string
  notes: string
  book: {
    title: string
    authors: string[]
    coverImageUrl: string | null
    categories: string[]
  }
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
