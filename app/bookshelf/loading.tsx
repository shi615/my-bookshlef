export default function BookshelfLoading() {
  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-line">
          <div className="h-9 w-40 bg-line rounded animate-pulse" />
          <div className="h-9 w-24 bg-line rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-parchment rounded-lg border border-line shadow-book overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-line/60" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-line rounded w-full" />
                <div className="h-3 bg-line rounded w-2/3" />
                <div className="h-4 bg-line rounded-full w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
