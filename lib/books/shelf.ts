import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { adminApp } from '@/lib/firebase/admin'
import type {
  BookshelfEntry,
  CreateBookshelfEntryInput,
  ReadingStatus,
} from '@/lib/types/bookshelf-entry'

function entriesCollection(uid: string) {
  return getFirestore(adminApp()).collection('users').doc(uid).collection('bookshelfEntries')
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(value as string | number)
}

function toEntry(id: string, data: FirebaseFirestore.DocumentData): BookshelfEntry {
  return {
    entryId: id,
    isbn: data.isbn as string,
    readingStatus: data.readingStatus as ReadingStatus,
    dateAdded: toDate(data.dateAdded),
    updatedAt: toDate(data.updatedAt),
    notes: (data.notes as string) ?? '',
    titleOverride: data.titleOverride as string | undefined,
    authorsOverride: data.authorsOverride as string[] | undefined,
    coverImageUrlOverride: data.coverImageUrlOverride as string | undefined,
  }
}

/**
 * Check whether a user already has one or more entries for the given ISBN.
 * Returns an array of simplified existing entries.
 */
export async function checkDuplicateEntry(
  uid: string,
  isbn: string
): Promise<Array<{ entryId: string; dateAdded: Date; readingStatus: ReadingStatus }>> {
  const snapshot = await entriesCollection(uid).where('isbn', '==', isbn).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      entryId: doc.id,
      dateAdded: toDate(data.dateAdded),
      readingStatus: data.readingStatus as ReadingStatus,
    }
  })
}

/**
 * Add a new BookshelfEntry for a user. Does NOT check for duplicates —
 * duplicate checking must happen at the route level.
 */
export async function addBookshelfEntry(
  uid: string,
  input: CreateBookshelfEntryInput
): Promise<BookshelfEntry> {
  const now = FieldValue.serverTimestamp()
  const docData: Record<string, unknown> = {
    isbn: input.isbn,
    readingStatus: 'want_to_read',
    dateAdded: now,
    updatedAt: now,
    notes: input.notes ?? '',
  }

  if (input.titleOverride !== undefined) docData.titleOverride = input.titleOverride
  if (input.authorsOverride !== undefined) docData.authorsOverride = input.authorsOverride
  if (input.coverImageUrlOverride !== undefined)
    docData.coverImageUrlOverride = input.coverImageUrlOverride

  const docRef = await entriesCollection(uid).add(docData)
  const created = await docRef.get()
  return toEntry(docRef.id, created.data()!)
}

/**
 * List all bookshelf entries for a user, optionally filtered by reading status.
 */
export async function getBookshelfEntries(
  uid: string,
  options?: { status?: ReadingStatus; limit?: number }
): Promise<BookshelfEntry[]> {
  let query: FirebaseFirestore.Query = entriesCollection(uid).orderBy('dateAdded', 'desc')

  if (options?.status) {
    query = query.where('readingStatus', '==', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map((doc) => toEntry(doc.id, doc.data()))
}
