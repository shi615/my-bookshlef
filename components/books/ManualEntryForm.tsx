'use client'

import { useState } from 'react'
import { validateIsbn } from '@/lib/books/isbn'

interface ManualEntryFormProps {
  onSubmitIsbn: (isbn: string) => void
  onCancel: () => void
}

export default function ManualEntryForm({ onSubmitIsbn, onCancel }: ManualEntryFormProps) {
  const [isbn, setIsbn] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = isbn.trim()

    if (!trimmed) {
      setValidationError('Please enter an ISBN.')
      return
    }

    if (!validateIsbn(trimmed)) {
      setValidationError('This does not look like a valid ISBN-10 or ISBN-13.')
      return
    }

    setValidationError(null)
    onSubmitIsbn(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-parchment rounded-xl border border-line shadow-book p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">ISBN を手入力</h2>
      <p className="text-sm text-muted mb-4">
        バーコードを読み取れなかった場合は、本の裏にある ISBN を入力してください。
      </p>

      <label className="block text-sm font-medium text-ink mb-1">
        ISBN (10桁または13桁)
      </label>
      <input
        type="text"
        value={isbn}
        onChange={(e) => {
          setIsbn(e.target.value)
          setValidationError(null)
        }}
        placeholder="例: 9784101092058"
        className="w-full rounded border border-line bg-paper px-3 py-2 text-sm mb-1
                   focus:outline-none focus:ring-2 focus:ring-brass"
        autoFocus
      />

      {validationError && (
        <p className="text-xs text-red-600 mb-3">{validationError}</p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-leather px-4 py-2 text-parchment font-medium
                     hover:bg-leather-dark"
        >
          本を検索
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-line px-4 py-2 text-ink
                     font-medium hover:bg-paper"
        >
          戻る
        </button>
      </div>
    </form>
  )
}
