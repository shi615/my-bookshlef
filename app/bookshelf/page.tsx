import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionCookieValue } from '@/lib/auth/session'
import { getBookshelfEntries } from '@/lib/books/shelf'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { isBookFound } from '@/lib/types/book'
import { STATUS_LABELS, STATUS_COLOURS } from '@/lib/books/reading-status'
import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

interface ShelfEntry {
  entryId: string
  isbn: string
  readingStatus: ReadingStatus
  dateAdded: string
  notes: string
  book: {
    title: string
    authors: string[]
    coverImageUrl: string | null
  }
}

async function getShelfEntries(uid: string): Promise<ShelfEntry[]> {
  const entries = await getBookshelfEntries(uid)

  return Promise.all(
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

        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-4">Your shelf is empty.</p>
            <Link
              href="/books/add"
              className="text-indigo-600 underline hover:no-underline"
            >
              Add your first book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {entries.map((entry) => (
              <Link
                key={entry.entryId}
                href={`/bookshelf/${entry.entryId}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden block
                           hover:shadow-md transition-shadow"
              >
                <div className="aspect-[2/3] bg-gray-100 relative">
                  {entry.book.coverImageUrl ? (
                    <Image
                      src={entry.book.coverImageUrl}
                      alt={`Cover of ${entry.book.title}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs p-2 text-center">
                      No cover
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm leading-tight line-clamp-2 mb-1">
                    {entry.book.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {entry.book.authors.join(', ')}
                  </p>
                  <span
                    className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium
                                ${STATUS_COLOURS[entry.readingStatus]}`}
                  >
                    {STATUS_LABELS[entry.readingStatus]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
