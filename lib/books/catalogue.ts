import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { adminApp } from '@/lib/firebase/admin'
import type { Book, BookNotFound, BookLookupResult } from '@/lib/types/book'

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

interface GoogleBooksVolumeInfo {
  title?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  categories?: string[]
}

interface GoogleBooksResponse {
  items?: Array<{ volumeInfo: GoogleBooksVolumeInfo }>
}

async function fetchFromGoogleBooks(isbn: string): Promise<Book | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = (await res.json()) as GoogleBooksResponse
  if (!data.items || data.items.length === 0) return null

  const info = data.items[0].volumeInfo
  const coverUrl =
    info.imageLinks?.thumbnail?.replace('http://', 'https://') ??
    info.imageLinks?.smallThumbnail?.replace('http://', 'https://') ??
    null

  return {
    isbn,
    title: info.title ?? 'Unknown Title',
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    description: info.description ?? null,
    coverImageUrl: coverUrl,
    categories: info.categories ?? [],
    source: 'google_books',
    cachedAt: new Date(),
  }
}

/**
 * Look up a book by ISBN-13. Checks Firestore cache first (30-day TTL),
 * then falls back to Google Books API. Cache writes are server-side only.
 */
export async function lookupBookByIsbn(isbn: string): Promise<BookLookupResult> {
  const db = getFirestore(adminApp())
  const docRef = db.collection('books').doc(isbn)

  // Check Firestore cache
  const cached = await docRef.get()
  if (cached.exists) {
    const data = cached.data()!
    const cachedAt: Date =
      data.cachedAt && typeof data.cachedAt.toDate === 'function'
        ? data.cachedAt.toDate()
        : new Date(0)

    if (Date.now() - cachedAt.getTime() < CACHE_TTL_MS) {
      return {
        isbn: data.isbn as string,
        title: data.title as string,
        authors: (data.authors as string[]) ?? [],
        publisher: (data.publisher as string | null) ?? null,
        publishedDate: (data.publishedDate as string | null) ?? null,
        description: (data.description as string | null) ?? null,
        coverImageUrl: (data.coverImageUrl as string | null) ?? null,
        categories: (data.categories as string[]) ?? [],
        source: data.source as 'google_books' | 'manual',
        cachedAt,
      }
    }
  }

  // Cache miss or expired — fetch from Google Books API
  const book = await fetchFromGoogleBooks(isbn)

  if (!book) {
    return { isbn, found: false } satisfies BookNotFound
  }

  // Write to Firestore cache (server-side via Admin SDK)
  await docRef.set(
    {
      isbn: book.isbn,
      title: book.title,
      authors: book.authors,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      coverImageUrl: book.coverImageUrl,
      categories: book.categories,
      source: book.source,
      cachedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return book
}
