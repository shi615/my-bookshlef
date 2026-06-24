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
    <form onSubmit={handleSubmit} className="bg-parchment rounded-xl border border-line shadow-book p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-1">本が見つかりません</h2>
      <p className="text-sm text-muted mb-4">
        ISBN <span className="font-mono text-xs">{isbn}</span> はカタログに見つかりませんでした。
        情報を手入力してください。
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            タイトル <span className="text-leather">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brass"
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            著者 <span className="text-leather">*</span>{' '}
            <span className="font-normal text-muted">(カンマ区切り)</span>
          </label>
          <input
            type="text"
            value={authors}
            onChange={(e) => { setAuthors(e.target.value); setErrors((p) => ({ ...p, authors: undefined })) }}
            placeholder="例: 村上春樹"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brass"
          />
          {errors.authors && <p className="text-xs text-red-600 mt-1">{errors.authors}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            表紙画像 <span className="text-muted font-normal">(任意)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleCoverChange}
            className="block text-sm text-muted file:mr-3 file:rounded file:border-0
                       file:bg-leather/10 file:px-3 file:py-1 file:text-leather
                       file:cursor-pointer hover:file:bg-leather/20"
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
          戻る
        </button>
      </div>
    </form>
  )
}
