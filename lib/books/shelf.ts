import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { adminApp } from '@/lib/firebase/admin'
import type {
  BookshelfEntry,
  CreateBookshelfEntryInput,
  ReadingStatus,
  UpdateBookshelfEntryInput,
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
    descriptionOverride: data.descriptionOverride as string | undefined,
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
 * Fetch a single bookshelf entry by its id. Returns null if it does not exist.
 */
export async function getBookshelfEntryById(
  uid: string,
  entryId: string
): Promise<BookshelfEntry | null> {
  const doc = await entriesCollection(uid).doc(entryId).get()
  if (!doc.exists) {
    return null
  }
  return toEntry(doc.id, doc.data()!)
}

/**
 * Update an existing entry. Scalar fields are set directly; for the override
 * fields, a value sets the override while `null` clears it (reverting to the
 * catalogue value). Returns the updated entry, or null if it does not exist.
 */
export async function updateBookshelfEntry(
  uid: string,
  entryId: string,
  patch: UpdateBookshelfEntryInput
): Promise<BookshelfEntry | null> {
  const docRef = entriesCollection(uid).doc(entryId)
  const existing = await docRef.get()
  if (!existing.exists) {
    return null
  }

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (patch.readingStatus !== undefined) updateData.readingStatus = patch.readingStatus
  if (patch.notes !== undefined) updateData.notes = patch.notes

  // Override fields: null clears the override, any other value sets it.
  const overrideKeys = [
    'titleOverride',
    'authorsOverride',
    'coverImageUrlOverride',
    'descriptionOverride',
  ] as const
  for (const key of overrideKeys) {
    const value = patch[key]
    if (value === undefined) continue
    updateData[key] = value === null ? FieldValue.delete() : value
  }

  await docRef.update(updateData)
  const updated = await docRef.get()
  return toEntry(docRef.id, updated.data()!)
}

/**
 * Delete a bookshelf entry. Returns true if it existed and was deleted,
 * false if no entry with the given id exists.
 */
export async function deleteBookshelfEntry(uid: string, entryId: string): Promise<boolean> {
  const docRef = entriesCollection(uid).doc(entryId)
  const existing = await docRef.get()
  if (!existing.exists) {
    return false
  }
  await docRef.delete()
  return true
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
