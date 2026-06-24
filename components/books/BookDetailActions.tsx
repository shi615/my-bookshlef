'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { READING_STATUSES, STATUS_LABELS } from '@/lib/books/reading-status'
import type { ReadingStatus } from '@/lib/types/bookshelf-entry'

interface BookDetailActionsProps {
  entryId: string
  initialReadingStatus: ReadingStatus
  initialNotes: string
}

export default function BookDetailActions({
  entryId,
  initialReadingStatus,
  initialNotes,
}: BookDetailActionsProps) {
  const router = useRouter()

  const [readingStatus, setReadingStatus] = useState<ReadingStatus>(initialReadingStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [statusSaving, setStatusSaving] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function patch(payload: Record<string, unknown>): Promise<boolean> {
    setError(null)
    const res = await fetch(`/api/books/shelf/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      setError('保存に失敗しました。もう一度お試しください。')
      return false
    }
    return true
  }

  async function handleStatusChange(next: ReadingStatus) {
    const previous = readingStatus
    setReadingStatus(next)
    setStatusSaving(true)
    const ok = await patch({ readingStatus: next })
    if (!ok) setReadingStatus(previous)
    setStatusSaving(false)
    if (ok) router.refresh()
  }

  async function handleNotesSave() {
    setNotesSaving(true)
    const ok = await patch({ notes })
    if (ok) {
      setSavedNotes(notes)
      router.refresh()
    }
    setNotesSaving(false)
  }

  async function handleDelete() {
    if (!window.confirm('この本を本棚から削除しますか？')) return
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/books/shelf/${entryId}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('削除に失敗しました。もう一度お試しください。')
      setDeleting(false)
      return
    }
    router.push('/bookshelf')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Reading status */}
      <div>
        <label htmlFor="reading-status" className="block text-sm font-medium text-gray-700 mb-1">
          読書ステータス
        </label>
        <select
          id="reading-status"
          value={readingStatus}
          disabled={statusSaving}
          onChange={(e) => handleStatusChange(e.target.value as ReadingStatus)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                     disabled:opacity-50"
        >
          {READING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ
        </label>
        <textarea
          id="notes"
          value={notes}
          rows={4}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="感想やメモを書く…"
        />
        <button
          type="button"
          onClick={handleNotesSave}
          disabled={notesSaving || notes === savedNotes}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {notesSaving ? '保存中…' : 'メモを保存'}
        </button>
      </div>

      {/* Delete */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700
                     hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? '削除中…' : '本棚から削除'}
        </button>
      </div>
    </div>
  )
}
