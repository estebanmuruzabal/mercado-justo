import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

import type { ProductBaseIdentifyResultDto } from '../dto/product-base-search.dto'
import { searchProductBases } from '../queries/search-product-bases.queries'
import type { ImageIdentificationInput, ProductIdentifierPort } from '../../domain/product-identifier.port'
import { createOpenAIProductIdentifier } from '../../infrastructure/openai-product-identifier'

function textMatchScore(query: string, candidateName: string): number {
  const q = query.trim().toLowerCase()
  const name = candidateName.trim().toLowerCase()
  if (!q || !name) return 0
  if (name === q) return 1
  if (name.startsWith(q)) return 0.9
  if (name.includes(q) || q.includes(name)) return 0.75
  const qTokens = q.split(/\s+/).filter(Boolean)
  const matched = qTokens.filter((token) => name.includes(token)).length
  return qTokens.length > 0 ? matched / qTokens.length : 0
}

export async function identifyProductBasesFromImage(input: {
  image: ImageIdentificationInput
  listingType?: ListingType
  identifier?: ProductIdentifierPort
  limit?: number
}): Promise<ProductBaseIdentifyResultDto[]> {
  const identifier = input.identifier ?? createOpenAIProductIdentifier()
  const limit = input.limit ?? 5

  const visionCandidates = await identifier.identify(input.image)
  const results = new Map<string, ProductBaseIdentifyResultDto>()

  for (const candidate of visionCandidates) {
    const matches = await searchProductBases({
      query: candidate.name,
      listingType: input.listingType,
      limit: 10,
    })

    for (const match of matches) {
      const textScore = textMatchScore(candidate.name, match.name)
      const combined = candidate.confidence * (0.5 + textScore * 0.5)
      const existing = results.get(match.id)

      if (!existing || combined > existing.confidence) {
        results.set(match.id, {
          ...match,
          confidence: Math.min(1, Math.max(0, combined)),
        })
      }
    }
  }

  return [...results.values()].sort((a, b) => b.confidence - a.confidence).slice(0, limit)
}
