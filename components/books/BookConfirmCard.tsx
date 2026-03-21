'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface BookDetails {
  isbn: string
  title: string
  authors: string[]
  publisher: string | null
  publishedDate: string | null
  description: string | null
  coverImageUrl: string | null
}

interface BookConfirmCardProps {
  book: BookDetails
  onConfirm: (details: BookDetails) => void
  onCancel: () => void
  isSaving?: boolean
}

export default function BookConfirmCard({
  book,
  onConfirm,
  onCancel,
  isSaving = false,
}: BookConfirmCardProps) {
  const [title, setTitle] = useState(book.title)
  const [authors, setAuthors] = useState(book.authors.join(', '))

  const hasEdits = title !== book.title || authors !== book.authors.join(', ')

  function handleConfirm() {
    onConfirm({
      ...book,
      title,
      authors: authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    })
  }

  function handleReset() {
    setTitle(book.title)
    setAuthors(book.authors.join(', '))
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-4">Confirm Book Details</h2>

      <div className="flex gap-4 mb-6">
        {book.coverImageUrl && (
          <div className="shrink-0">
            <Image
              src={book.coverImageUrl}
              alt={`Cover of ${book.title}`}
              width={80}
              height={112}
              className="rounded object-cover"
            />
          </div>
        )}

        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Author(s) <span className="font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {book.publishedDate && (
            <p className="text-xs text-gray-500">Published: {book.publishedDate}</p>
          )}
        </div>
      </div>

      {book.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{book.description}</p>
      )}

      {hasEdits && (
        <p className="text-xs text-amber-600 mb-3">
          You have unsaved edits.{' '}
          <button
            type="button"
            onClick={handleReset}
            className="underline hover:no-underline"
          >
            Reset to original
          </button>
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium
                     hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Add to Shelf'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700
                     font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
