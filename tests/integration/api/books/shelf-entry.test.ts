/**
 * Integration tests for GET, PATCH and DELETE /api/books/shelf/[entryId]
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/books/shelf/[entryId]/route'
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
  getBookshelfEntryById: vi.fn(),
  updateBookshelfEntry: vi.fn(),
  deleteBookshelfEntry: vi.fn(),
}))

// Mock catalogue service (to join book data in GET)
vi.mock('@/lib/books/catalogue', () => ({
  lookupBookByIsbn: vi.fn(),
}))

function makeParams(entryId: string) {
  return { params: Promise.resolve({ entryId }) }
}

describe('GET /api/books/shelf/[entryId]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue({ uid: 'test-user-123' })
  })

  it('returns the enriched entry for an authenticated user', async () => {
    const { getBookshelfEntryById } = await import('@/lib/books/shelf')
    const { lookupBookByIsbn } = await import('@/lib/books/catalogue')

    vi.mocked(getBookshelfEntryById).mockResolvedValue({
      entryId: 'entry-abc',
      isbn: '9784101092058',
      readingStatus: 'reading',
      dateAdded: new Date('2026-03-21'),
      updatedAt: new Date('2026-03-22'),
      notes: 'good',
    })
    vi.mocked(lookupBookByIsbn).mockResolvedValue({
      isbn: '9784101092058',
      title: 'ノルウェイの森',
      authors: ['村上春樹'],
      publisher: '新潮社',
      publishedDate: '1987',
      description: 'desc',
      coverImageUrl: null,
      categories: ['Fiction'],
      source: 'google_books',
      cachedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc')
    const response = await GET(request, makeParams('entry-abc'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.entryId).toBe('entry-abc')
    expect(body.book.title).toBe('ノルウェイの森')
    expect(body.book.publisher).toBe('新潮社')
    expect(body.readingStatus).toBe('reading')
  })

  it('returns 404 when the entry does not exist', async () => {
    const { getBookshelfEntryById } = await import('@/lib/books/shelf')
    vi.mocked(getBookshelfEntryById).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/missing')
    const response = await GET(request, makeParams('missing'))

    expect(response.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc')
    const response = await GET(request, makeParams('entry-abc'))

    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/books/shelf/[entryId]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue({ uid: 'test-user-123' })
  })

  it('updates reading status and returns 200', async () => {
    const { updateBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(updateBookshelfEntry).mockResolvedValue({
      entryId: 'entry-abc',
      isbn: '9784101092058',
      readingStatus: 'read',
      dateAdded: new Date('2026-03-21'),
      updatedAt: new Date('2026-03-22'),
      notes: '',
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingStatus: 'read' }),
    })
    const response = await PATCH(request, makeParams('entry-abc'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.readingStatus).toBe('read')
  })

  it('returns 400 for an invalid reading status', async () => {
    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingStatus: 'nonsense' }),
    })
    const response = await PATCH(request, makeParams('entry-abc'))

    expect(response.status).toBe(400)
  })

  it('returns 400 when no updatable fields are provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await PATCH(request, makeParams('entry-abc'))

    expect(response.status).toBe(400)
  })

  it('returns 404 when the entry does not exist', async () => {
    const { updateBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(updateBookshelfEntry).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/missing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'hi' }),
    })
    const response = await PATCH(request, makeParams('missing'))

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/books/shelf/[entryId]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue({ uid: 'test-user-123' })
  })

  it('deletes the entry and returns 200', async () => {
    const { deleteBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(deleteBookshelfEntry).mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc', {
      method: 'DELETE',
    })
    const response = await DELETE(request, makeParams('entry-abc'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 404 when the entry does not exist', async () => {
    const { deleteBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(deleteBookshelfEntry).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/missing', {
      method: 'DELETE',
    })
    const response = await DELETE(request, makeParams('missing'))

    expect(response.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/shelf/entry-abc', {
      method: 'DELETE',
    })
    const response = await DELETE(request, makeParams('entry-abc'))

    expect(response.status).toBe(401)
  })
})
