export interface Book {
  isbn: string // ISBN-13 (normalised)
  title: string
  authors: string[]
  publisher: string | null
  publishedDate: string | null
  description: string | null
  coverImageUrl: string | null
  categories: string[]
  source: 'google_books' | 'manual'
  cachedAt: Date
}

export interface BookNotFound {
  isbn: string
  found: false
}

export type BookLookupResult = Book | BookNotFound

export function isBookFound(result: BookLookupResult): result is Book {
  return !('found' in result)
}
