/**
 * Integration tests for GET and POST /api/books/shelf
 *
 * These tests require the Firebase Local Emulator to be running:
 *   firebase emulators:start
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/books/shelf/route'
import { NextRequest } from 'next/server'

// Mock session verification
vi.mock('@/lib/auth/session', () => ({
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-user-123' }),
  SESSION_COOKIE_NAME: 'session',
  SESSION_DURATION_MS: 432000000,
  createSessionCookie: vi.fn(),
}))

// Mock shelf service
vi.mock('@/lib/books/shelf', () => ({
  addBookshelfEntry: vi.fn(),
  getBookshelfEntries: vi.fn(),
  checkDuplicateEntry: vi.fn(),
}))

// Mock catalogue service for GET (to join book data)
vi.mock('@/lib/books/catalogue', () => ({
  lookupBookByIsbn: vi.fn(),
}))

describe('POST /api/books/shelf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new bookshelf entry and returns 201', async () => {
    const { addBookshelfEntry, checkDuplicateEntry } = await import('@/lib/books/shelf')

    vi.mocked(checkDuplicateEntry).mockResolvedValue([])
    vi.mocked(addBookshelfEntry).mockResolvedValue({
      entryId: 'entry-abc',
      isbn: '9784101092058',
      readingStatus: 'want_to_read',
      dateAdded: new Date('2026-03-21'),
      updatedAt: new Date('2026-03-21'),
      notes: '',
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: '9784101092058' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.entryId).toBe('entry-abc')
    expect(body.readingStatus).toBe('want_to_read')
  })

  it('returns 409 when a duplicate is detected and confirmDuplicate is not set', async () => {
    const { checkDuplicateEntry } = await import('@/lib/books/shelf')

    vi.mocked(checkDuplicateEntry).mockResolvedValue([
      { entryId: 'old-entry', dateAdded: new Date('2025-01-01'), readingStatus: 'read' },
    ])

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: '9784101092058' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe('duplicate')
    expect(body.existingEntries).toHaveLength(1)
  })

  it('creates entry when confirmDuplicate is true despite existing entry', async () => {
    const { addBookshelfEntry } = await import('@/lib/books/shelf')

    vi.mocked(addBookshelfEntry).mockResolvedValue({
      entryId: 'entry-def',
      isbn: '9784101092058',
      readingStatus: 'want_to_read',
      dateAdded: new Date('2026-03-21'),
      updatedAt: new Date('2026-03-21'),
      notes: '',
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: '9784101092058', confirmDuplicate: true }),
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
  })

  it('returns 400 when isbn is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: '9784101092058' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })
})

describe('GET /api/books/shelf', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue({ uid: 'test-user-123' })
  })

  it('returns list of shelf entries for authenticated user', async () => {
    const { getBookshelfEntries } = await import('@/lib/books/shelf')
    const { lookupBookByIsbn } = await import('@/lib/books/catalogue')

    vi.mocked(getBookshelfEntries).mockResolvedValue([
      {
        entryId: 'entry-abc',
        isbn: '9784101092058',
        readingStatus: 'want_to_read',
        dateAdded: new Date('2026-03-21'),
        updatedAt: new Date('2026-03-21'),
        notes: '',
      },
    ])
    vi.mocked(lookupBookByIsbn).mockResolvedValue({
      isbn: '9784101092058',
      title: 'ノルウェイの森',
      authors: ['村上春樹'],
      publisher: null,
      publishedDate: null,
      description: null,
      coverImageUrl: null,
      categories: [],
      source: 'google_books',
      cachedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'GET',
    })
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entries).toHaveLength(1)
    expect(body.entries[0].book.title).toBe('ノルウェイの森')
  })
})
