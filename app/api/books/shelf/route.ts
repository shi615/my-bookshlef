import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie } from '@/lib/auth/session'
import {
  addBookshelfEntry,
  checkDuplicateEntry,
  getBookshelfEntries,
} from '@/lib/books/shelf'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { normaliseIsbn, validateIsbn } from '@/lib/books/isbn'
import { isBookFound } from '@/lib/types/book'
import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

// ── GET /api/books/shelf ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await verifySessionCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') as ReadingStatus | null
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50

  const validStatuses: ReadingStatus[] = ['want_to_read', 'reading', 'read']
  const status = statusParam && validStatuses.includes(statusParam) ? statusParam : undefined

  const entries = await getBookshelfEntries(session.uid, { status, limit })

  // Enrich entries with book data
  const enriched = await Promise.all(
    entries.map(async (entry) => {
      const book = await lookupBookByIsbn(entry.isbn)
      const bookData = isBookFound(book)
        ? {
            title: entry.titleOverride ?? book.title,
            authors: entry.authorsOverride ?? book.authors,
            coverImageUrl: entry.coverImageUrlOverride ?? book.coverImageUrl,
          }
        : {
            title: entry.titleOverride ?? '(Unknown title)',
            authors: entry.authorsOverride ?? [],
            coverImageUrl: entry.coverImageUrlOverride ?? null,
          }

      return {
        entryId: entry.entryId,
        isbn: entry.isbn,
        readingStatus: entry.readingStatus,
        dateAdded: entry.dateAdded.toISOString(),
        notes: entry.notes,
        book: bookData,
      }
    })
  )

  return NextResponse.json({ entries: enriched, nextCursor: null })
}

// ── POST /api/books/shelf ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await verifySessionCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { isbn: rawIsbn, confirmDuplicate, notes, titleOverride, authorsOverride, coverImageUrlOverride } = body as {
    isbn?: unknown
    confirmDuplicate?: unknown
    notes?: unknown
    titleOverride?: unknown
    authorsOverride?: unknown
    coverImageUrlOverride?: unknown
  }

  if (typeof rawIsbn !== 'string' || !rawIsbn) {
    return NextResponse.json({ error: 'isbn is required' }, { status: 400 })
  }

  if (!validateIsbn(rawIsbn)) {
    return NextResponse.json({ error: 'Invalid ISBN format' }, { status: 400 })
  }

  const isbn = normaliseIsbn(rawIsbn)

  // Duplicate check (skip when confirmDuplicate is explicitly true)
  if (confirmDuplicate !== true) {
    const existing = await checkDuplicateEntry(session.uid, isbn)
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: 'duplicate',
          message: 'This book is already in your shelf.',
          existingEntries: existing.map((e) => ({
            entryId: e.entryId,
            dateAdded: e.dateAdded.toISOString(),
            readingStatus: e.readingStatus,
          })),
        },
        { status: 409 }
      )
    }
  }

  const entry = await addBookshelfEntry(session.uid, {
    isbn,
    notes: typeof notes === 'string' ? notes : '',
    titleOverride: typeof titleOverride === 'string' ? titleOverride : undefined,
    authorsOverride: Array.isArray(authorsOverride)
      ? (authorsOverride as string[])
      : undefined,
    coverImageUrlOverride:
      typeof coverImageUrlOverride === 'string' ? coverImageUrlOverride : undefined,
  })

  return NextResponse.json(
    {
      entryId: entry.entryId,
      isbn: entry.isbn,
      readingStatus: entry.readingStatus,
      dateAdded: entry.dateAdded.toISOString(),
      notes: entry.notes,
    },
    { status: 201 }
  )
}
