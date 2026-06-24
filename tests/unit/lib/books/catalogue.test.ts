import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupBookByIsbn } from '@/lib/books/catalogue'

// Mock firebase-admin Firestore
vi.mock('@/lib/firebase/admin', () => ({
  adminApp: vi.fn(() => ({})),
}))

vi.mock('firebase-admin/firestore', () => {
  const mockGet = vi.fn()
  const mockSet = vi.fn()
  const mockDoc = vi.fn(() => ({ get: mockGet, set: mockSet }))
  const mockCollection = vi.fn(() => ({ doc: mockDoc }))
  return {
    getFirestore: vi.fn(() => ({ collection: mockCollection })),
    FieldValue: { serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP') },
    Timestamp: { fromDate: vi.fn((d: Date) => ({ toDate: () => d })) },
  }
})

// Mock global fetch for Google Books API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('lookupBookByIsbn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_BOOKS_API_KEY = 'test-api-key'
  })

  it('returns book from Firestore cache when fresh (< 30 days)', async () => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const freshDate = new Date()
    const mockDoc = {
      exists: true,
      data: () => ({
        isbn: '9784101092058',
        title: 'ノルウェイの森',
        authors: ['村上春樹'],
        publisher: '新潮社',
        publishedDate: '2004',
        description: 'A novel',
        coverImageUrl: 'https://example.com/cover.jpg',
        categories: ['Fiction'],
        source: 'google_books',
        cachedAt: { toDate: () => freshDate },
      }),
    }
    ;(getFirestore as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ get: vi.fn().mockResolvedValue(mockDoc), set: vi.fn() })),
      })),
    })

    const result = await lookupBookByIsbn('9784101092058')

    expect(result).not.toBeNull()
    if (result && 'title' in result) {
      expect(result.title).toBe('ノルウェイの森')
    }
    // Should NOT call Google Books API
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches from Google Books API on cache miss', async () => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const mockDocRef = { get: vi.fn().mockResolvedValue({ exists: false }), set: vi.fn() }
    ;(getFirestore as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: vi.fn(() => ({ doc: vi.fn(() => mockDocRef) })),
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              volumeInfo: {
                title: 'ノルウェイの森',
                authors: ['村上春樹'],
                publisher: '新潮社',
                publishedDate: '2004',
                description: 'A novel',
                imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
                categories: ['Fiction'],
              },
            },
          ],
        }),
    })

    const result = await lookupBookByIsbn('9784101092058')

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result).not.toBeNull()
    if (result && 'title' in result) {
      expect(result.title).toBe('ノルウェイの森')
    }
  })

  it('returns BookNotFound when Google Books API returns empty items', async () => {
    const { getFirestore } = await import('firebase-admin/firestore')
    ;(getFirestore as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ exists: false }), set: vi.fn() })),
      })),
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    })

    const result = await lookupBookByIsbn('9784101092058')

    expect(result).toEqual({ isbn: '9784101092058', found: false })
  })
})
