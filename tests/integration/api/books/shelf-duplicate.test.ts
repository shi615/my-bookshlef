/**
 * Integration tests for duplicate detection in POST /api/books/shelf
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/books/shelf/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/session', () => ({
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-user-123' }),
  SESSION_COOKIE_NAME: 'session',
  SESSION_DURATION_MS: 432000000,
  createSessionCookie: vi.fn(),
}))

vi.mock('@/lib/books/shelf', () => ({
  addBookshelfEntry: vi.fn(),
  getBookshelfEntries: vi.fn().mockResolvedValue([]),
  checkDuplicateEntry: vi.fn(),
}))

vi.mock('@/lib/books/catalogue', () => ({
  lookupBookByIsbn: vi.fn(),
}))

describe('POST /api/books/shelf — duplicate handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 409 with existing entries when duplicate detected', async () => {
    const { checkDuplicateEntry } = await import('@/lib/books/shelf')
    vi.mocked(checkDuplicateEntry).mockResolvedValue([
      {
        entryId: 'old-entry',
        dateAdded: new Date('2025-06-01'),
        readingStatus: 'read',
      },
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
    expect(body.existingEntries[0].readingStatus).toBe('read')
  })

  it('creates entry successfully when confirmDuplicate is true', async () => {
    const { checkDuplicateEntry, addBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(checkDuplicateEntry).mockResolvedValue([])
    vi.mocked(addBookshelfEntry).mockResolvedValue({
      entryId: 'new-entry',
      isbn: '9784101092058',
      readingStatus: 'want_to_read',
      dateAdded: new Date(),
      updatedAt: new Date(),
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

  it('skips duplicate check when confirmDuplicate is true', async () => {
    const { checkDuplicateEntry, addBookshelfEntry } = await import('@/lib/books/shelf')
    vi.mocked(addBookshelfEntry).mockResolvedValue({
      entryId: 'new-entry',
      isbn: '9784101092058',
      readingStatus: 'want_to_read',
      dateAdded: new Date(),
      updatedAt: new Date(),
      notes: '',
    })

    const request = new NextRequest('http://localhost:3000/api/books/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: '9784101092058', confirmDuplicate: true }),
    })
    await POST(request)

    expect(checkDuplicateEntry).not.toHaveBeenCalled()
  })
})
