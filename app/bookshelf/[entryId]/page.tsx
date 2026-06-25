import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { verifySessionCookieValue } from '@/lib/auth/session'
import { getBookshelfEntryById } from '@/lib/books/shelf'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { isBookFound } from '@/lib/types/book'
import { STATUS_LABELS, STATUS_COLOURS } from '@/lib/books/reading-status'
import BookDetailActions from '@/components/books/BookDetailActions'
import BookDetailEdit from '@/components/books/BookDetailEdit'

interface BookDetailPageProps {
  params: Promise<{ entryId: string }>
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { entryId } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) {
    redirect('/login')
  }

  const session = await verifySessionCookieValue(sessionCookie)
  if (!session) {
    redirect('/login')
  }

  const entry = await getBookshelfEntryById(session.uid, entryId)
  if (!entry) {
    notFound()
  }

  const book = await lookupBookByIsbn(entry.isbn)
  const bookData = isBookFound(book)
    ? {
        title: entry.titleOverride ?? book.title,
        authors: entry.authorsOverride ?? book.authors,
        coverImageUrl: entry.coverImageUrlOverride ?? book.coverImageUrl,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: entry.descriptionOverride ?? book.description,
        categories: book.categories,
      }
    : {
        title: entry.titleOverride ?? '(Unknown title)',
        authors: entry.authorsOverride ?? [],
        coverImageUrl: entry.coverImageUrlOverride ?? null,
        publisher: null,
        publishedDate: null,
        description: entry.descriptionOverride ?? null,
        categories: [] as string[],
      }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/bookshelf"
          className="inline-block mb-6 text-sm text-leather hover:underline"
        >
          ← 本棚に戻る
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          {/* Cover */}
          <div className="aspect-[2/3] bg-paper relative rounded-lg overflow-hidden border border-line shadow-book">
            {bookData.coverImageUrl ? (
              <Image
                src={bookData.coverImageUrl}
                alt={`Cover of ${bookData.title}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm p-2 text-center font-serif">
                表紙なし
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold leading-snug">{bookData.title}</h1>
              <span
                className={`shrink-0 inline-block text-xs px-2 py-0.5 rounded-full font-medium
                            ${STATUS_COLOURS[entry.readingStatus]}`}
              >
                {STATUS_LABELS[entry.readingStatus]}
              </span>
            </div>

            {bookData.authors.length > 0 && (
              <p className="text-muted mb-4">{bookData.authors.join(', ')}</p>
            )}

            <dl className="space-y-1 text-sm text-ink mb-6">
              {bookData.publisher && (
                <div className="flex gap-2">
                  <dt className="font-medium text-muted w-20 shrink-0">出版社</dt>
                  <dd>{bookData.publisher}</dd>
                </div>
              )}
              {bookData.publishedDate && (
                <div className="flex gap-2">
                  <dt className="font-medium text-muted w-20 shrink-0">出版日</dt>
                  <dd>{bookData.publishedDate}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="font-medium text-muted w-20 shrink-0">ISBN</dt>
                <dd>{entry.isbn}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-muted w-20 shrink-0">追加日</dt>
                <dd>{entry.dateAdded.toLocaleDateString('ja-JP')}</dd>
              </div>
              {bookData.categories.length > 0 && (
                <div className="flex gap-2">
                  <dt className="font-medium text-muted w-20 shrink-0">カテゴリ</dt>
                  <dd>{bookData.categories.join(', ')}</dd>
                </div>
              )}
            </dl>

            {bookData.description && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-ink mb-1">説明</h2>
                <p className="text-sm text-muted whitespace-pre-line leading-relaxed">
                  {bookData.description}
                </p>
              </div>
            )}

            <BookDetailEdit
              entryId={entry.entryId}
              initialTitle={bookData.title}
              initialAuthors={bookData.authors}
              initialCoverImageUrl={bookData.coverImageUrl}
              initialDescription={bookData.description}
            />

            <div className="mt-8">
              <BookDetailActions
                entryId={entry.entryId}
                initialReadingStatus={entry.readingStatus}
                initialNotes={entry.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
