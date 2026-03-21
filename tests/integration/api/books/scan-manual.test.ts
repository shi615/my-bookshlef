/**
 * Integration tests for the manual ISBN fallback path in /api/books/scan
 * (barcode_not_detected → user types ISBN → manual book entry)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/books/scan/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/gemini/isbn-extractor', () => ({
  extractIsbnFromImage: vi.fn().mockResolvedValue({ isbn: null, confidence: 'none' }),
}))

vi.mock('@/lib/books/catalogue', () => ({
  lookupBookByIsbn: vi.fn().mockResolvedValue({ isbn: '9784101092058', found: false }),
}))

vi.mock('@/lib/auth/session', () => ({
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-user-123' }),
  SESSION_COOKIE_NAME: 'session',
  SESSION_DURATION_MS: 432000000,
  createSessionCookie: vi.fn(),
}))

describe('POST /api/books/scan — manual fallback path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns barcode_not_detected when Gemini cannot read the barcode', async () => {
    const formData = new FormData()
    formData.append('image', new Blob([Buffer.from('blurry')], { type: 'image/jpeg' }), 'img.jpg')

    const request = new NextRequest('http://localhost:3000/api/books/scan', {
      method: 'POST',
      body: formData,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result).toBe('barcode_not_detected')
    expect(body.isbn).toBeNull()
  })

  it('returns not_in_catalogue when ISBN is found but book not in catalogue', async () => {
    const { extractIsbnFromImage } = await import('@/lib/gemini/isbn-extractor')
    vi.mocked(extractIsbnFromImage).mockResolvedValueOnce({
      isbn: '9784101092058',
      confidence: 'high',
    })

    const formData = new FormData()
    formData.append('image', new Blob([Buffer.from('img')], { type: 'image/jpeg' }), 'img.jpg')

    const request = new NextRequest('http://localhost:3000/api/books/scan', {
      method: 'POST',
      body: formData,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.result).toBe('not_in_catalogue')
    expect(body.isbn).toBe('9784101092058')
  })
})
