import { describe, it, expect } from 'vitest'
import { filterEntries, sortEntries, collectCategories } from '@/lib/books/filter'
import type { ShelfEntryView } from '@/lib/types/bookshelf-entry'

function entry(overrides: Partial<ShelfEntryView> = {}): ShelfEntryView {
  return {
    entryId: 'e1',
    isbn: '9784101092058',
    readingStatus: 'want_to_read',
    dateAdded: '2026-01-01T00:00:00.000Z',
    notes: '',
    book: {
      title: 'Sample Book',
      authors: ['Jane Doe'],
      coverImageUrl: null,
      categories: [],
    },
    ...overrides,
  }
}

const entries: ShelfEntryView[] = [
  entry({
    entryId: 'a',
    isbn: '9784101092058',
    readingStatus: 'reading',
    dateAdded: '2026-03-01T00:00:00.000Z',
    notes: 'borrowed from Alice',
    book: {
      title: 'The Pragmatic Programmer',
      authors: ['Andrew Hunt', 'David Thomas'],
      coverImageUrl: null,
      categories: ['Computers', 'Programming'],
    },
  }),
  entry({
    entryId: 'b',
    isbn: '9780132350884',
    readingStatus: 'read',
    dateAdded: '2026-01-15T00:00:00.000Z',
    notes: '',
    book: {
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      coverImageUrl: null,
      categories: ['Computers'],
    },
  }),
  entry({
    entryId: 'c',
    isbn: '9784062748537',
    readingStatus: 'want_to_read',
    dateAdded: '2026-02-10T00:00:00.000Z',
    notes: 'gift',
    book: {
      title: 'Norwegian Wood',
      authors: ['Haruki Murakami'],
      coverImageUrl: null,
      categories: ['Fiction'],
    },
  }),
]

const noFilter = { query: '', status: 'all' as const, category: 'all' as const }

describe('filterEntries', () => {
  it('returns all entries with an empty query and no filters', () => {
    expect(filterEntries(entries, noFilter)).toHaveLength(3)
  })

  it('matches by title (case-insensitive)', () => {
    const result = filterEntries(entries, { ...noFilter, query: 'clean' })
    expect(result.map((e) => e.entryId)).toEqual(['b'])
  })

  it('matches by author', () => {
    const result = filterEntries(entries, { ...noFilter, query: 'murakami' })
    expect(result.map((e) => e.entryId)).toEqual(['c'])
  })

  it('matches by ISBN', () => {
    const result = filterEntries(entries, { ...noFilter, query: '9780132350884' })
    expect(result.map((e) => e.entryId)).toEqual(['b'])
  })

  it('matches by notes', () => {
    const result = filterEntries(entries, { ...noFilter, query: 'alice' })
    expect(result.map((e) => e.entryId)).toEqual(['a'])
  })

  it('ignores surrounding whitespace in the query', () => {
    const result = filterEntries(entries, { ...noFilter, query: '   gift  ' })
    expect(result.map((e) => e.entryId)).toEqual(['c'])
  })

  it('filters by reading status', () => {
    const result = filterEntries(entries, { ...noFilter, status: 'want_to_read' })
    expect(result.map((e) => e.entryId)).toEqual(['c'])
  })

  it('filters by category', () => {
    const result = filterEntries(entries, { ...noFilter, category: 'Computers' })
    expect(result.map((e) => e.entryId)).toEqual(['a', 'b'])
  })

  it('combines query, status and category filters', () => {
    const result = filterEntries(entries, {
      query: 'code',
      status: 'read',
      category: 'Computers',
    })
    expect(result.map((e) => e.entryId)).toEqual(['b'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterEntries(entries, { ...noFilter, query: 'nonexistent' })).toEqual([])
  })
})

describe('sortEntries', () => {
  it('sorts by date added, newest first', () => {
    const result = sortEntries(entries, 'date_desc')
    expect(result.map((e) => e.entryId)).toEqual(['a', 'c', 'b'])
  })

  it('sorts by date added, oldest first', () => {
    const result = sortEntries(entries, 'date_asc')
    expect(result.map((e) => e.entryId)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by title ascending', () => {
    const result = sortEntries(entries, 'title_asc')
    expect(result.map((e) => e.book.title)).toEqual([
      'Clean Code',
      'Norwegian Wood',
      'The Pragmatic Programmer',
    ])
  })

  it('sorts by title descending', () => {
    const result = sortEntries(entries, 'title_desc')
    expect(result.map((e) => e.book.title)).toEqual([
      'The Pragmatic Programmer',
      'Norwegian Wood',
      'Clean Code',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [...entries]
    sortEntries(input, 'title_asc')
    expect(input.map((e) => e.entryId)).toEqual(['a', 'b', 'c'])
  })
})

describe('collectCategories', () => {
  it('returns a deduplicated, alphabetically sorted list', () => {
    expect(collectCategories(entries)).toEqual(['Computers', 'Fiction', 'Programming'])
  })

  it('returns an empty array when no entries have categories', () => {
    expect(collectCategories([entry({ book: { ...entry().book, categories: [] } })])).toEqual([])
  })

  it('ignores empty category strings', () => {
    const result = collectCategories([
      entry({ book: { ...entry().book, categories: ['', 'Fiction'] } }),
    ])
    expect(result).toEqual(['Fiction'])
  })
})
