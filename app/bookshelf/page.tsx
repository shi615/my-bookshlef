import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookieValue } from '@/lib/auth/session'
import { getBookshelfEntries } from '@/lib/books/shelf'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { isBookFound } from '@/lib/types/book'
import BookshelfBrowser from '@/components/books/BookshelfBrowser'
import type { ShelfEntryView } from '@/lib/types/bookshelf-entry'

async function getShelfEntries(uid: string): Promise<ShelfEntryView[]> {
  const entries = await getBookshelfEntries(uid)

  return Promise.all(
    entries.map(async (entry) => {
      const book = await lookupBookByIsbn(entry.isbn)
      const bookData = isBookFound(book)
        ? {
            title: entry.titleOverride ?? book.title,
            authors: entry.authorsOverride ?? book.authors,
            coverImageUrl: entry.coverImageUrlOverride ?? book.coverImageUrl,
            categories: book.categories ?? [],
          }
        : {
            title: entry.titleOverride ?? '(Unknown title)',
            authors: entry.authorsOverride ?? [],
            coverImageUrl: entry.coverImageUrlOverride ?? null,
            categories: [],
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
}

export default async function BookshelfPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) {
    redirect('/login')
  }

  const session = await verifySessionCookieValue(sessionCookie)
  if (!session) {
    redirect('/login')
  }

  const entries = await getShelfEntries(session.uid)

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Bookshelf</h1>
          <Link
            href="/books/add"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium
                       hover:bg-indigo-700"
          >
            + Add Book
          </Link>
        </div>

        <BookshelfBrowser entries={entries} />
      </div>
    </main>
  )
}
