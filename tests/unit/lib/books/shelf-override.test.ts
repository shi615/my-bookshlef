import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase-admin
vi.mock('@/lib/firebase/admin', () => ({ adminApp: vi.fn(() => ({})) }))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP') },
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({ toDate: () => d })),
  },
}))

describe('BookshelfEntry override fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores titleOverride when provided', async () => {
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore')
    const mockAdd = vi.fn().mockResolvedValue({ id: 'entry-001' })
    const mockGet = vi.fn().mockResolvedValue({
      data: () => ({
        isbn: '9784101092058',
        readingStatus: 'want_to_read',
        dateAdded: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        notes: '',
        titleOverride: 'My Custom Title',
      }),
    })
    ;(getFirestore as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            add: mockAdd,
            where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [] }) }),
          }),
        }),
      }),
    })
    // Patch the add ref to return get
    mockAdd.mockResolvedValue({ id: 'entry-001', get: mockGet })

    const { addBookshelfEntry } = await import('@/lib/books/shelf')
    const entry = await addBookshelfEntry('user-123', {
      isbn: '9784101092058',
      titleOverride: 'My Custom Title',
    })

    expect(entry.titleOverride).toBe('My Custom Title')
    expect(FieldValue.serverTimestamp).toHaveBeenCalled()
  })

  it('does not set titleOverride when not provided', async () => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const mockAdd = vi.fn()
    const mockGet = vi.fn().mockResolvedValue({
      data: () => ({
        isbn: '9784101092058',
        readingStatus: 'want_to_read',
        dateAdded: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        notes: '',
      }),
    })
    mockAdd.mockResolvedValue({ id: 'entry-002', get: mockGet })

    ;(getFirestore as ReturnType<typeof vi.fn>).mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            add: mockAdd,
            where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [] }) }),
          }),
        }),
      }),
    })

    const { addBookshelfEntry } = await import('@/lib/books/shelf')
    const entry = await addBookshelfEntry('user-123', { isbn: '9784101092058' })

    expect(entry.titleOverride).toBeUndefined()
  })
})
