'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { READING_STATUSES, STATUS_LABELS, STATUS_COLOURS } from '@/lib/books/reading-status'
import {
  filterEntries,
  sortEntries,
  collectCategories,
  type StatusFilter,
  type CategoryFilter,
  type SortOption,
} from '@/lib/books/filter'
import type { ShelfEntryView } from '@/lib/types/bookshelf-entry'

interface BookshelfBrowserProps {
  entries: ShelfEntryView[]
}

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: '追加が新しい順',
  date_asc: '追加が古い順',
  published_desc: '出版が新しい順',
  published_asc: '出版が古い順',
  title_asc: 'タイトル A→Z',
  title_desc: 'タイトル Z→A',
}

export default function BookshelfBrowser({ entries }: BookshelfBrowserProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort, setSort] = useState<SortOption>('date_desc')

  const categories = useMemo(() => collectCategories(entries), [entries])

  const visible = useMemo(() => {
    const filtered = filterEntries(entries, { query, status, category })
    return sortEntries(filtered, sort)
  }, [entries, query, status, category, sort])

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg mb-4 font-serif">本棚はまだ空です。</p>
        <Link href="/books/add" className="text-leather underline hover:no-underline">
          最初の一冊を追加する
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・著者・ISBN・メモで検索…"
          className="w-full rounded-lg border border-line bg-parchment px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus('all')}
            className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors
                        ${
                          status === 'all'
                            ? 'bg-leather text-parchment border-leather'
                            : 'bg-parchment text-ink border-line hover:bg-paper'
                        }`}
          >
            すべて
          </button>
          {READING_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors
                          ${
                            status === s
                              ? 'border-transparent ' + STATUS_COLOURS[s]
                              : 'bg-parchment text-ink border-line hover:bg-paper'
                          }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-line px-2 py-1 text-sm bg-parchment
                           focus:outline-none focus:ring-2 focus:ring-brass"
              >
                <option value="all">すべてのカテゴリ</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-line px-2 py-1 text-sm bg-parchment
                         focus:outline-none focus:ring-2 focus:ring-brass"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-serif">条件に合う本が見つかりません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {visible.map((entry) => (
            <Link
              key={entry.entryId}
              href={`/bookshelf/${entry.entryId}`}
              className="bg-parchment rounded-lg border border-line shadow-book overflow-hidden block
                         transition-transform duration-200 hover:-translate-y-1 hover:border-brass"
            >
              <div className="aspect-[2/3] bg-paper relative border-b border-line">
                {entry.book.coverImageUrl ? (
                  <Image
                    src={entry.book.coverImageUrl}
                    alt={`Cover of ${entry.book.title}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted text-xs p-2 text-center font-serif">
                    表紙なし
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-serif font-medium text-sm leading-tight line-clamp-2 mb-1">
                  {entry.book.title}
                </p>
                <p className="text-xs text-muted line-clamp-1">
                  {entry.book.authors.join(', ')}
                </p>
                <span
                  className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium
                              ${STATUS_COLOURS[entry.readingStatus]}`}
                >
                  {STATUS_LABELS[entry.readingStatus]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
