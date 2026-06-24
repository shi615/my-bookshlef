'use client'

import { useState, useRef } from 'react'

export interface ScanResult {
  result: 'found' | 'not_in_catalogue' | 'barcode_not_detected'
  isbn: string | null
  book: {
    isbn: string
    title: string
    authors: string[]
    publisher: string | null
    publishedDate: string | null
    description: string | null
    coverImageUrl: string | null
    categories: string[]
  } | null
}

interface ISBNScannerProps {
  onScanComplete: (result: ScanResult) => void
  onError: (message: string) => void
}

export default function ISBNScanner({ onScanComplete, onError }: ISBNScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      onError('File too large (max 10 MB). Please try a smaller image.')
      return
    }

    setIsScanning(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/books/scan', { method: 'POST', body: formData })
      const data = (await res.json()) as ScanResult & { error?: string }

      if (res.status === 401) {
        onError('__unauthorized__')
        return
      }

      if (!res.ok) {
        onError(data.error ?? 'Scan failed. Please try again.')
        return
      }

      onScanComplete(data)
    } catch {
      onError('Network error. Please check your connection and try again.')
    } finally {
      setIsScanning(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // reset so the same file can be selected again
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-parchment shadow-book p-6">
      <h2 className="text-xl font-semibold">バーコードをスキャン</h2>
      <p className="text-sm text-muted text-center">
        本の ISBN バーコードを撮影するか、画像をアップロードしてください。
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        {/* Camera capture */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isScanning}
          className="flex-1 rounded-lg bg-leather px-4 py-3 text-parchment font-medium
                     hover:bg-leather-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📷 撮影する
        </button>

        {/* File upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex-1 rounded-lg border-2 border-leather px-4 py-3
                     text-leather font-medium hover:bg-leather/5
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          画像を選ぶ
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />

      {isScanning && (
        <div className="flex items-center gap-2 text-muted">
          <span className="animate-spin">⟳</span>
          <span>スキャン中…</span>
        </div>
      )}
    </div>
  )
}
