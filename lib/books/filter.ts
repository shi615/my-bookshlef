import type { ReadingStatus, ShelfEntryView } from '@/lib/types/bookshelf-entry'

export type StatusFilter = ReadingStatus | 'all'
export type CategoryFilter = string | 'all'
export type SortOption = 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'

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
  }

  return sorted
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
