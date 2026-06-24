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
            publishedDate: book.publishedDate,
            categories: book.categories ?? [],
          }
        : {
            title: entry.titleOverride ?? '(Unknown title)',
            authors: entry.authorsOverride ?? [],
            coverImageUrl: entry.coverImageUrlOverride ?? null,
            publishedDate: null,
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
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8 pb-5 border-b border-line">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Bookshelf</h1>
            <p className="mt-1 text-sm text-muted">あなたの書斎</p>
          </div>
          <Link
            href="/books/add"
            className="shrink-0 rounded-lg bg-leather px-4 py-2 text-parchment font-medium
                       shadow-sm transition-colors hover:bg-leather-dark"
          >
            ＋ 本を追加
          </Link>
        </div>

        <BookshelfBrowser entries={entries} />
      </div>
    </main>
  )
}
