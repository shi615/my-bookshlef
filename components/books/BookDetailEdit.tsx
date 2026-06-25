'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BookDetailEditProps {
  entryId: string
  initialTitle: string
  initialAuthors: string[]
  initialCoverImageUrl: string | null
  initialDescription: string | null
}

export default function BookDetailEdit({
  entryId,
  initialTitle,
  initialAuthors,
  initialCoverImageUrl,
  initialDescription,
}: BookDetailEditProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [authors, setAuthors] = useState(initialAuthors.join(', '))
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetFields() {
    setTitle(initialTitle)
    setAuthors(initialAuthors.join(', '))
    setCoverImageUrl(initialCoverImageUrl ?? '')
    setDescription(initialDescription ?? '')
    setError(null)
  }

  function handleCancel() {
    resetFields()
    setOpen(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/books/shelf/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // An empty value clears the override and reverts to the catalogue value.
        titleOverride: title,
        authorsOverride: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        coverImageUrlOverride: coverImageUrl,
        descriptionOverride: description,
      }),
    })

    if (!res.ok) {
      setError('保存に失敗しました。もう一度お試しください。')
      setSaving(false)
      return
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-leather
                   hover:bg-paper"
      >
        本の情報を編集
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4 space-y-4">
      <h2 className="text-sm font-semibold text-ink">本の情報を編集</h2>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Cover preview */}
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt="表紙プレビュー"
          className="h-32 w-auto rounded border border-line object-cover"
        />
      )}

      <div>
        <label htmlFor="edit-cover" className="block text-sm font-medium text-ink mb-1">
          カバー画像URL
        </label>
        <input
          id="edit-cover"
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-line bg-parchment px-3 py-2 text-sm
                     focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>

      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-ink mb-1">
          タイトル
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-line bg-parchment px-3 py-2 text-sm
                     focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>

      <div>
        <label htmlFor="edit-authors" className="block text-sm font-medium text-ink mb-1">
          作者（カンマ区切り）
        </label>
        <input
          id="edit-authors"
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="村上春樹, …"
          className="w-full rounded-lg border border-line bg-parchment px-3 py-2 text-sm
                     focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="block text-sm font-medium text-ink mb-1">
          説明
        </label>
        <textarea
          id="edit-description"
          value={description}
          rows={6}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-line bg-parchment px-3 py-2 text-sm
                     focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          placeholder="本の説明…"
        />
      </div>

      <p className="text-xs text-muted">
        空欄にすると元の書誌情報に戻ります。
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-leather px-4 py-2 text-sm font-medium text-parchment
                     hover:bg-leather-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink
                     hover:bg-parchment disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
