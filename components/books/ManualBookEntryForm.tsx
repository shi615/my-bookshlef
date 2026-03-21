'use client'

import { useState } from 'react'

interface ManualBookEntryFormProps {
  isbn: string
  onConfirm: (details: { title: string; authors: string[]; coverImageUrl?: string }) => void
  onCancel: () => void
  isSaving?: boolean
}

export default function ManualBookEntryForm({
  isbn,
  onConfirm,
  onCancel,
  isSaving = false,
}: ManualBookEntryFormProps) {
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ title?: string; authors?: string }>({})

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Cover image must be under 5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setCoverPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function validate() {
    const errs: typeof errors = {}
    if (!title.trim()) errs.title = 'Title is required.'
    if (!authors.trim()) errs.authors = 'At least one author is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onConfirm({
      title: title.trim(),
      authors: authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      coverImageUrl: coverPreview ?? undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-1">Book Not Found</h2>
      <p className="text-sm text-gray-500 mb-4">
        ISBN <span className="font-mono text-xs">{isbn}</span> was not found in the catalogue.
        Enter the details manually.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Author(s) <span className="text-red-500">*</span>{' '}
            <span className="font-normal text-gray-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={authors}
            onChange={(e) => { setAuthors(e.target.value); setErrors((p) => ({ ...p, authors: undefined })) }}
            placeholder="e.g. 村上春樹"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errors.authors && <p className="text-xs text-red-600 mt-1">{errors.authors}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleCoverChange}
            className="block text-sm text-gray-600 file:mr-3 file:rounded file:border-0
                       file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700
                       file:cursor-pointer hover:file:bg-indigo-100"
          />
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="Cover preview" className="mt-2 h-24 rounded object-cover" />
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
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
          Back
        </button>
      </div>
    </form>
  )
}
