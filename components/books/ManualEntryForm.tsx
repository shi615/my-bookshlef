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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">Enter ISBN Manually</h2>
      <p className="text-sm text-gray-500 mb-4">
        Couldn&apos;t read the barcode? Type the ISBN number from the back of the book.
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        ISBN (10 or 13 digits)
      </label>
      <input
        type="text"
        value={isbn}
        onChange={(e) => {
          setIsbn(e.target.value)
          setValidationError(null)
        }}
        placeholder="e.g. 9784101092058"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm mb-1
                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
        autoFocus
      />

      {validationError && (
        <p className="text-xs text-red-600 mb-3">{validationError}</p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium
                     hover:bg-indigo-700"
        >
          Look Up Book
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700
                     font-medium hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    </form>
  )
}
