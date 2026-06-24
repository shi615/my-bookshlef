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
    <div className="bg-parchment rounded-xl border border-line shadow-book p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-4">本の情報を確認</h2>

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
            <label className="block text-xs font-medium text-muted mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-line bg-paper px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              著者 <span className="font-normal">(カンマ区切り)</span>
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              className="w-full rounded border border-line bg-paper px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>

          {book.publishedDate && (
            <p className="text-xs text-muted">出版: {book.publishedDate}</p>
          )}
        </div>
      </div>

      {book.description && (
        <p className="text-sm text-muted mb-4 line-clamp-3">{book.description}</p>
      )}

      {hasEdits && (
        <p className="text-xs text-brass mb-3">
          未保存の編集があります。{' '}
          <button
            type="button"
            onClick={handleReset}
            className="underline hover:no-underline"
          >
            元に戻す
          </button>
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex-1 rounded-lg bg-leather px-4 py-2 text-parchment font-medium
                     hover:bg-leather-dark disabled:opacity-50"
        >
          {isSaving ? '保存中…' : '本棚に追加'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-lg border border-line px-4 py-2 text-ink
                     font-medium hover:bg-paper disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
