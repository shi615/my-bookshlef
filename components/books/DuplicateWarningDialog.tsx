'use client'

interface ExistingEntry {
  entryId: string
  dateAdded: string
  readingStatus: string
}

interface DuplicateWarningDialogProps {
  book: { title: string; authors: string[] }
  existingEntries: ExistingEntry[]
  onConfirm: () => void
  onCancel: () => void
}

const STATUS_LABELS: Record<string, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
}

export default function DuplicateWarningDialog({
  book,
  existingEntries,
  onConfirm,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <div className="bg-parchment rounded-xl border border-line shadow-book p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">すでに本棚にあります</h2>
      <p className="text-sm text-muted mb-4">
        <strong className="text-ink">{book.title}</strong> はすでに本棚に登録されています:
      </p>

      <ul className="mb-4 space-y-2">
        {existingEntries.map((e) => (
          <li key={e.entryId} className="text-sm text-ink bg-paper border border-line rounded px-3 py-2">
            {new Date(e.dateAdded).toLocaleDateString('ja-JP')} に追加 ·{' '}
            {STATUS_LABELS[e.readingStatus] ?? e.readingStatus}
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted mb-5">それでも別の一冊として追加しますか？</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-leather px-4 py-2 text-parchment font-medium
                     hover:bg-leather-dark"
        >
          追加する
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-line px-4 py-2 text-ink
                     font-medium hover:bg-paper"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
