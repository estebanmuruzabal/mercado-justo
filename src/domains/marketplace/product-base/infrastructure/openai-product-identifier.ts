import type {
  ImageIdentificationInput,
  ProductIdentificationCandidate,
  ProductIdentifierPort,
} from '../domain/product-identifier.port'

const VISION_MODEL = 'gpt-4o-mini'

type VisionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function parseCandidates(content: string): ProductIdentificationCandidate[] {
  const trimmed = content.trim()
  const jsonStart = trimmed.indexOf('[')
  const jsonEnd = trimmed.lastIndexOf(']')
  if (jsonStart === -1 || jsonEnd === -1) return []

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const name = typeof record.name === 'string' ? record.name.trim() : ''
        const confidence = typeof record.confidence === 'number' ? record.confidence : 0
        if (!name) return null
        return { name, confidence: Math.min(1, Math.max(0, confidence)) }
      })
      .filter((item): item is ProductIdentificationCandidate => item !== null)
      .slice(0, 5)
  } catch {
    return []
  }
}

export class OpenAIProductIdentifier implements ProductIdentifierPort {
  constructor(private readonly apiKey: string) {}

  async identify(input: ImageIdentificationInput): Promise<ProductIdentificationCandidate[]> {
    const base64 = input.buffer.toString('base64')
    const dataUrl = `data:${input.mimeType};base64,${base64}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              'Identificá el producto alimenticio o de consumo en la imagen. Respondé SOLO con JSON válido: un array de hasta 5 objetos {"name": string, "confidence": number entre 0 y 1}. Nombres en español, concretos (ej. "Tomate redondo", "Leche entera"). Sin markdown ni texto extra.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '¿Qué producto es este? Devolvé candidatos ordenados por confianza.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI Vision failed (${response.status}): ${body.slice(0, 200)}`)
    }

    const payload = (await response.json()) as VisionResponse
    const content = payload.choices?.[0]?.message?.content ?? ''
    const candidates = parseCandidates(content)

    if (candidates.length === 0) {
      throw new Error('No se pudo identificar el producto en la imagen.')
    }

    return candidates
  }
}

export function createOpenAIProductIdentifier(): ProductIdentifierPort {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada.')
  }
  return new OpenAIProductIdentifier(apiKey)
}
