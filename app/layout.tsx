import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Bookshelf',
  description: 'Your personal digital bookshelf',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
