import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie } from '@/lib/auth/session'
import { extractIsbnFromImage } from '@/lib/gemini/isbn-extractor'
import { lookupBookByIsbn } from '@/lib/books/catalogue'
import { normaliseIsbn, validateIsbn } from '@/lib/books/isbn'
import { isBookFound } from '@/lib/types/book'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export async function POST(request: NextRequest) {
  // Auth check
  const session = await verifySessionCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const imageFile = formData.get('image')

  if (!imageFile || !(imageFile instanceof Blob)) {
    return NextResponse.json({ error: 'Image file required' }, { status: 400 })
  }

  if (imageFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const mimeType = imageFile.type as AllowedMimeType
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use JPEG, PNG, or HEIC.' },
      { status: 400 }
    )
  }

  // Extract ISBN from image using Gemini Vision
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
  let extraction: Awaited<ReturnType<typeof extractIsbnFromImage>>

  try {
    extraction = await extractIsbnFromImage(imageBuffer, mimeType)
  } catch (err) {
    console.error('[scan] Gemini extraction error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (!extraction.isbn) {
    return NextResponse.json({ result: 'barcode_not_detected', isbn: null, book: null })
  }

  // Normalise and validate ISBN
  const rawIsbn = extraction.isbn
  if (!validateIsbn(rawIsbn)) {
    return NextResponse.json({ result: 'barcode_not_detected', isbn: null, book: null })
  }
  const isbn = normaliseIsbn(rawIsbn)

  // Look up book metadata
  const lookupResult = await lookupBookByIsbn(isbn)

  if (!isBookFound(lookupResult)) {
    return NextResponse.json({ result: 'not_in_catalogue', isbn, book: null })
  }

  return NextResponse.json({
    result: 'found',
    isbn,
    book: {
      isbn: lookupResult.isbn,
      title: lookupResult.title,
      authors: lookupResult.authors,
      publisher: lookupResult.publisher,
      publishedDate: lookupResult.publishedDate,
      description: lookupResult.description,
      coverImageUrl: lookupResult.coverImageUrl,
      categories: lookupResult.categories,
    },
  })
}
