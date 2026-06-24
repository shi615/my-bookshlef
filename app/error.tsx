'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="bg-parchment rounded-xl border border-line shadow-book p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-semibold text-leather mb-3">問題が発生しました</h2>
        <p className="text-sm text-muted mb-6">
          {error.message ?? '予期しないエラーが発生しました。'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-leather px-5 py-2 text-parchment font-medium hover:bg-leather-dark"
        >
          もう一度試す
        </button>
      </div>
    </main>
  )
}
