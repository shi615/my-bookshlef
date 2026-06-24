'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ISBNScanner, { type ScanResult } from '@/components/books/ISBNScanner'
import BookConfirmCard, { type BookDetails } from '@/components/books/BookConfirmCard'
import ManualEntryForm from '@/components/books/ManualEntryForm'
import ManualBookEntryForm from '@/components/books/ManualBookEntryForm'
import DuplicateWarningDialog from '@/components/books/DuplicateWarningDialog'

type PageState =
  | { step: 'scan' }
  | { step: 'confirm'; book: BookDetails; isbn: string }
  | { step: 'manual_isbn' }
  | { step: 'manual_book'; isbn: string }
  | { step: 'duplicate'; book: BookDetails; isbn: string; existingEntries: ExistingEntry[] }

interface ExistingEntry {
  entryId: string
  dateAdded: string
  readingStatus: string
}

export default function AddBookPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>({ step: 'scan' })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function handleScanComplete(result: ScanResult) {
    setError(null)

    if (result.result === 'found' && result.book && result.isbn) {
      setState({ step: 'confirm', book: result.book, isbn: result.isbn })
    } else if (result.result === 'not_in_catalogue' && result.isbn) {
      setState({ step: 'manual_book', isbn: result.isbn })
    } else {
      // barcode_not_detected
      setState({ step: 'manual_isbn' })
    }
  }

  function handleScanError(message: string) {
    if (message === '__unauthorized__') {
      router.push('/login')
      return
    }
    setError(message)
  }

  async function saveEntry(
    isbn: string,
    overrides: Partial<BookDetails>,
    confirmDuplicate = false
  ) {
    setIsSaving(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        isbn,
        notes: '',
        confirmDuplicate,
      }
      if (overrides.title !== undefined) body.titleOverride = overrides.title
      if (overrides.authors !== undefined) body.authorsOverride = overrides.authors
      if (overrides.coverImageUrl !== undefined) body.coverImageUrlOverride = overrides.coverImageUrl

      const res = await fetch('/api/books/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.status === 409 && data.error === 'duplicate') {
        const currentBook =
          state.step === 'confirm'
            ? state.book
            : { isbn, title: overrides.title ?? isbn, authors: overrides.authors ?? [], coverImageUrl: overrides.coverImageUrl ?? null, publisher: null, publishedDate: null, description: null }
        setState({
          step: 'duplicate',
          book: currentBook,
          isbn,
          existingEntries: data.existingEntries,
        })
        return
      }

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to save. Please try again.')
        return
      }

      router.push('/bookshelf')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">本を追加</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {state.step === 'scan' && (
          <ISBNScanner onScanComplete={handleScanComplete} onError={handleScanError} />
        )}

        {state.step === 'confirm' && (
          <BookConfirmCard
            book={state.book}
            isSaving={isSaving}
            onConfirm={(details) => {
              const origBook = state.step === 'confirm' ? state.book : details
              const isbn = state.step === 'confirm' ? state.isbn : details.isbn
              const overrides: Partial<BookDetails> = {}
              if (details.title !== origBook.title) overrides.title = details.title
              if (details.authors.join(',') !== origBook.authors.join(',')) overrides.authors = details.authors
              saveEntry(isbn, overrides)
            }}
            onCancel={() => setState({ step: 'scan' })}
          />
        )}

        {state.step === 'manual_isbn' && (
          <ManualEntryForm
            onSubmitIsbn={(isbn) => {
              // Re-trigger scan flow with the typed ISBN
              fetch('/api/books/scan', {
                method: 'POST',
                body: (() => {
                  // We send a minimal "manual ISBN" request — backend handles via form
                  // For manual ISBN, we just call the shelf lookup path directly
                  const fd = new FormData()
                  return fd
                })(),
              })
              // Instead, we directly look up the ISBN via a different approach:
              // Call scan endpoint is designed for images. For manual ISBN we
              // handle lookup client-side by going to manual_book step with the isbn.
              setState({ step: 'manual_book', isbn })
            }}
            onCancel={() => setState({ step: 'scan' })}
          />
        )}

        {state.step === 'manual_book' && (
          <ManualBookEntryForm
            isbn={state.isbn}
            onConfirm={(details) => saveEntry(state.isbn, details)}
            onCancel={() => setState({ step: 'scan' })}
            isSaving={isSaving}
          />
        )}

        {state.step === 'duplicate' && (
          <DuplicateWarningDialog
            book={state.book}
            existingEntries={state.existingEntries}
            onConfirm={() => {
              const bookState = state
              if (bookState.step === 'duplicate') {
                saveEntry(bookState.isbn, bookState.book, true)
              }
            }}
            onCancel={() => setState({ step: 'confirm', book: state.book, isbn: state.isbn })}
          />
        )}
      </div>
    </main>
  )
}
