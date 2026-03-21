'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-3">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-6">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-white font-medium hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
