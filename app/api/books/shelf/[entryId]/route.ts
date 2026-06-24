import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie } from '@/lib/auth/session'
import {
  getBookshelfEntryById,
  updateBookshelfEntry,
  deleteBookshelfEntry,
} from '@/lib/books/shelf'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { isBookFound } from '@/lib/types/book'
import { READING_STATUSES } from '@/lib/books/reading-status'
import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

type RouteContext = { params: Promise<{ entryId: string }> }

// ── GET /api/books/shelf/[entryId] ───────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await verifySessionCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await params
  const entry = await getBookshelfEntryById(session.uid, entryId)
  if (!entry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const book = await lookupBookByIsbn(entry.isbn)
  const bookData = isBookFound(book)
    ? {
        title: entry.titleOverride ?? book.title,
        authors: entry.authorsOverride ?? book.authors,
        coverImageUrl: entry.coverImageUrlOverride ?? book.coverImageUrl,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
        categories: book.categories,
      }
    : {
        title: entry.titleOverride ?? '(Unknown title)',
        authors: entry.authorsOverride ?? [],
        coverImageUrl: entry.coverImageUrlOverride ?? null,
        publisher: null,
        publishedDate: null,
        description: null,
        categories: [],
      }

  return NextResponse.json({
    entryId: entry.entryId,
    isbn: entry.isbn,
    readingStatus: entry.readingStatus,
    dateAdded: entry.dateAdded.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    notes: entry.notes,
    book: bookData,
  })
}

// ── PATCH /api/books/shelf/[entryId] ─────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const { readingStatus, notes } = body as { readingStatus?: unknown; notes?: unknown }
  const patch: { readingStatus?: ReadingStatus; notes?: string } = {}

  if (readingStatus !== undefined) {
    if (
      typeof readingStatus !== 'string' ||
      !READING_STATUSES.includes(readingStatus as ReadingStatus)
    ) {
      return NextResponse.json({ error: 'Invalid readingStatus' }, { status: 400 })
    }
    patch.readingStatus = readingStatus as ReadingStatus
  }

  if (notes !== undefined) {
    if (typeof notes !== 'string') {
      return NextResponse.json({ error: 'notes must be a string' }, { status: 400 })
    }
    patch.notes = notes
  }

  if (patch.readingStatus === undefined && patch.notes === undefined) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const { entryId } = await params
  const updated = await updateBookshelfEntry(session.uid, entryId, patch)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    entryId: updated.entryId,
    isbn: updated.isbn,
    readingStatus: updated.readingStatus,
    dateAdded: updated.dateAdded.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    notes: updated.notes,
  })
}

// ── DELETE /api/books/shelf/[entryId] ────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await verifySessionCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await params
  const deleted = await deleteBookshelfEntry(session.uid, entryId)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
