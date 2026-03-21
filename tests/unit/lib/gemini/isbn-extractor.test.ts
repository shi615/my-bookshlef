import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractIsbnFromImage } from '@/lib/gemini/isbn-extractor'

// Mock the @google/genai SDK
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
}))

describe('extractIsbnFromImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project'
    process.env.VERTEX_AI_LOCATION = 'asia-northeast1'
  })

  it('returns isbn and high confidence when barcode is clearly detected', async () => {
    const { GoogleGenAI } = await import('@google/genai')
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify({ isbn: '9784101092058', confidence: 'high' }),
    })
    ;(GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }))

    const imageBuffer = Buffer.from('fake-image-data')
    const result = await extractIsbnFromImage(imageBuffer, 'image/jpeg')

    expect(result.isbn).toBe('9784101092058')
    expect(result.confidence).toBe('high')
  })

  it('returns null isbn when no barcode is detected', async () => {
    const { GoogleGenAI } = await import('@google/genai')
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify({ isbn: null, confidence: 'none' }),
    })
    ;(GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }))

    const imageBuffer = Buffer.from('fake-image-data')
    const result = await extractIsbnFromImage(imageBuffer, 'image/jpeg')

    expect(result.isbn).toBeNull()
  })

  it('returns null isbn when Gemini returns malformed JSON', async () => {
    const { GoogleGenAI } = await import('@google/genai')
    const mockGenerate = vi.fn().mockResolvedValue({
      text: 'not json at all',
    })
    ;(GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }))

    const imageBuffer = Buffer.from('fake-image-data')
    const result = await extractIsbnFromImage(imageBuffer, 'image/jpeg')

    expect(result.isbn).toBeNull()
  })

  it('throws when the Gemini API call fails', async () => {
    const { GoogleGenAI } = await import('@google/genai')
    const mockGenerate = vi.fn().mockRejectedValue(new Error('API error'))
    ;(GoogleGenAI as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: { generateContent: mockGenerate },
    }))

    const imageBuffer = Buffer.from('fake-image-data')
    await expect(extractIsbnFromImage(imageBuffer, 'image/jpeg')).rejects.toThrow('API error')
  })
})
