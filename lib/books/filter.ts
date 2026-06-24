import type { ReadingStatus, ShelfEntryView } from '@/lib/types/bookshelf-entry'

export type StatusFilter = ReadingStatus | 'all'
export type CategoryFilter = string | 'all'
export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'title_asc'
  | 'title_desc'
  | 'published_desc'
  | 'published_asc'

export interface FilterCriteria {
  query: string
  status: StatusFilter
  category: CategoryFilter
}

/**
 * Filter entries by a free-text query (matched against title, authors, ISBN
 * and notes), reading status, and category. An empty/whitespace query matches
 * everything; 'all' disables the corresponding filter.
 */
export function filterEntries(
  entries: ShelfEntryView[],
  { query, status, category }: FilterCriteria
): ShelfEntryView[] {
  const q = query.trim().toLowerCase()

  return entries.filter((entry) => {
    if (status !== 'all' && entry.readingStatus !== status) {
      return false
    }

    if (category !== 'all' && !entry.book.categories.includes(category)) {
      return false
    }

    if (q.length > 0) {
      const haystack = [
        entry.book.title,
        entry.book.authors.join(' '),
        entry.isbn,
        entry.notes,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) {
        return false
      }
    }

    return true
  })
}

/**
 * Return a new array of entries sorted by the given option. Does not mutate
 * the input.
 */
export function sortEntries(entries: ShelfEntryView[], sort: SortOption): ShelfEntryView[] {
  const sorted = [...entries]

  switch (sort) {
    case 'date_desc':
      sorted.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
      break
    case 'date_asc':
      sorted.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded))
      break
    case 'title_asc':
      sorted.sort((a, b) => a.book.title.localeCompare(b.book.title))
      break
    case 'title_desc':
      sorted.sort((a, b) => b.book.title.localeCompare(a.book.title))
      break
    case 'published_desc':
      sorted.sort((a, b) => comparePublished(a, b, 'desc'))
      break
    case 'published_asc':
      sorted.sort((a, b) => comparePublished(a, b, 'asc'))
      break
  }

  return sorted
}

/**
 * Compare two entries by published date. Entries without a published date are
 * always sorted to the end, regardless of direction. Dates are compared as
 * strings, which orders the ISO-style values Google Books returns (e.g. '2004',
 * '1987-05', '2020-01-15') chronologically.
 */
function comparePublished(
  a: ShelfEntryView,
  b: ShelfEntryView,
  direction: 'asc' | 'desc'
): number {
  // Treat null, undefined and empty strings alike as "no date" so older shelf
  // entries or cached books missing the field still sort to the end safely.
  const pa = a.book.publishedDate || null
  const pb = b.book.publishedDate || null
  if (pa === null && pb === null) return 0
  if (pa === null) return 1
  if (pb === null) return -1
  return direction === 'asc' ? pa.localeCompare(pb) : pb.localeCompare(pa)
}

/**
 * Collect the unique set of categories across all entries, sorted
 * alphabetically. Used to populate the category filter dropdown.
 */
export function collectCategories(entries: ShelfEntryView[]): string[] {
  const set = new Set<string>()
  for (const entry of entries) {
    for (const category of entry.book.categories) {
      if (category) {
        set.add(category)
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
