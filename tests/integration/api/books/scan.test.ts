/**
 * Integration tests for POST /api/books/scan
 *
 * These tests require the Firebase Local Emulator to be running:
 *   firebase emulators:start
 *
 * The scan route calls Gemini Vision (mocked here) and Google Books API (mocked here).
 * Firestore interactions use the emulator.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/books/scan/route'
import { NextRequest } from 'next/server'

// Mock Gemini extractor
vi.mock('@/lib/gemini/isbn-extractor', () => ({
  extractIsbnFromImage: vi.fn(),
}))

// Mock catalogue service
vi.mock('@/lib/books/catalogue', () => ({
  lookupBookByIsbn: vi.fn(),
}))

// Mock session verification
vi.mock('@/lib/auth/session', () => ({
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-user-123' }),
  SESSION_COOKIE_NAME: 'session',
  SESSION_DURATION_MS: 432000000,
  createSessionCookie: vi.fn(),
}))

function makeMultipartRequest(imageData: Buffer, mimeType: string): NextRequest {
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(imageData)], { type: mimeType })
  formData.append('image', blob, 'barcode.jpg')

  return new NextRequest('http://localhost:3000/api/books/scan', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/books/scan', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue({ uid: 'test-user-123' })
  })

  it('returns found result when ISBN is detected and book exists in catalogue', async () => {
    const { extractIsbnFromImage } = await import('@/lib/gemini/isbn-extractor')
    const { lookupBookByIsbn } = await import('@/lib/books/catalogue')

    vi.mocked(extractIsbnFromImage).mockResolvedValue({
      isbn: '9784101092058',
      confidence: 'high',
    })
    vi.mocked(lookupBookByIsbn).mockResolvedValue({
      isbn: '9784101092058',
      title: 'ノルウェイの森',
      authors: ['村上春樹'],
      publisher: '新潮社',
      publishedDate: '2004',
      description: 'A novel',
      coverImageUrl: 'https://example.com/cover.jpg',
      categories: ['Fiction'],
      source: 'google_books',
      cachedAt: new Date(),
    })

    const request = makeMultipartRequest(Buffer.from('fake'), 'image/jpeg')
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result).toBe('found')
    expect(body.isbn).toBe('9784101092058')
    expect(body.book.title).toBe('ノルウェイの森')
  })

  it('returns not_in_catalogue when ISBN is detected but book is not found', async () => {
    const { extractIsbnFromImage } = await import('@/lib/gemini/isbn-extractor')
    const { lookupBookByIsbn } = await import('@/lib/books/catalogue')

    vi.mocked(extractIsbnFromImage).mockResolvedValue({
      isbn: '9784101092058',
      confidence: 'high',
    })
    vi.mocked(lookupBookByIsbn).mockResolvedValue({ isbn: '9784101092058', found: false })

    const request = makeMultipartRequest(Buffer.from('fake'), 'image/jpeg')
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result).toBe('not_in_catalogue')
    expect(body.isbn).toBe('9784101092058')
    expect(body.book).toBeNull()
  })

  it('returns barcode_not_detected when Gemini returns null isbn', async () => {
    const { extractIsbnFromImage } = await import('@/lib/gemini/isbn-extractor')

    vi.mocked(extractIsbnFromImage).mockResolvedValue({ isbn: null, confidence: 'none' })

    const request = makeMultipartRequest(Buffer.from('fake'), 'image/jpeg')
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result).toBe('barcode_not_detected')
    expect(body.isbn).toBeNull()
  })

  it('returns 401 when session cookie is missing', async () => {
    const { verifySessionCookie } = await import('@/lib/auth/session')
    vi.mocked(verifySessionCookie).mockResolvedValue(null)

    const request = makeMultipartRequest(Buffer.from('fake'), 'image/jpeg')
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 when no image is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/books/scan', {
      method: 'POST',
      body: new FormData(),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
