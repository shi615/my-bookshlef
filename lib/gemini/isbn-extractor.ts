import { GoogleGenAI } from '@google/genai'

export interface IsbnExtractionResult {
  isbn: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
}

const EXTRACTION_PROMPT = `You are an expert barcode reader. Your task is to find and extract an ISBN barcode from the provided image.

IMPORTANT: Look ONLY for a barcode stripe (vertical bars), not printed text.

Respond with valid JSON only — no other text:
{
  "isbn": "the ISBN digits as a string, or null if no barcode found",
  "confidence": "high | medium | low | none"
}

If no barcode is visible or it cannot be read, return: {"isbn": null, "confidence": "none"}`

function getGenAIClient(): GoogleGenAI {
  // Prefer Google AI Studio API key (simpler for local dev, no GCP project needed)
  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey) {
    return new GoogleGenAI({ apiKey })
  }

  // Fall back to Vertex AI (requires real GCP project + ADC credentials)
  const project = process.env.GOOGLE_CLOUD_PROJECT
  const location = process.env.VERTEX_AI_LOCATION ?? 'asia-northeast1'

  if (!project) {
    throw new Error(
      'Set GEMINI_API_KEY (Google AI Studio) or GOOGLE_CLOUD_PROJECT (Vertex AI)'
    )
  }

  return new GoogleGenAI({ vertexai: true, project, location })
}

/**
 * Send an image buffer to Gemini Vision and extract the ISBN from the barcode.
 */
export async function extractIsbnFromImage(
  imageBuffer: Buffer,
  mimeType: 'image/jpeg' | 'image/png' | 'image/heic'
): Promise<IsbnExtractionResult> {
  const genai = getGenAIClient()
  const base64Image = imageBuffer.toString('base64')

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  })

  const text = response.text ?? ''

  try {
    const parsed = JSON.parse(text) as { isbn?: string | null; confidence?: string }
    return {
      isbn: typeof parsed.isbn === 'string' ? parsed.isbn.replace(/[-\s]/g, '') : null,
      confidence: (['high', 'medium', 'low', 'none'] as const).includes(
        parsed.confidence as 'high' | 'medium' | 'low' | 'none'
      )
        ? (parsed.confidence as IsbnExtractionResult['confidence'])
        : 'none',
    }
  } catch {
    return { isbn: null, confidence: 'none' }
  }
}
