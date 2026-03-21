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
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">Already on Your Shelf</h2>
      <p className="text-sm text-gray-600 mb-4">
        <strong>{book.title}</strong> is already in your shelf:
      </p>

      <ul className="mb-4 space-y-2">
        {existingEntries.map((e) => (
          <li key={e.entryId} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
            Added {new Date(e.dateAdded).toLocaleDateString()} ·{' '}
            {STATUS_LABELS[e.readingStatus] ?? e.readingStatus}
          </li>
        ))}
      </ul>

      <p className="text-sm text-gray-600 mb-5">Add another copy anyway?</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium
                     hover:bg-indigo-700"
        >
          Add Another Copy
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700
                     font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
