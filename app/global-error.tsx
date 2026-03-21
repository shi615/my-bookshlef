'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Application Error</h2>
          <p className="text-sm text-gray-600 mb-6">A critical error has occurred.</p>
          <button
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
