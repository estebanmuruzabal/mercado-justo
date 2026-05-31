import type { CommercialSnapshot } from '../dto/commercial-snapshot.dto'
import { mapOfferVariantsToCommercialSnapshot } from '../mappers/commercial-snapshot.mapper'
import {
  findLegacyVariantsByPublicationIds,
  findVariantsByPublicationIds,
} from '../../infrastructure/offer.repository'

export async function resolveCommercialSnapshots(
  publicationIds: string[],
): Promise<Map<string, CommercialSnapshot>> {
  const uniqueIds = [...new Set(publicationIds)]
  const snapshots = new Map<string, CommercialSnapshot>()
  if (uniqueIds.length === 0) return snapshots

  const offerVariants = await findVariantsByPublicationIds(uniqueIds)
  const missingIds = uniqueIds.filter((id) => (offerVariants.get(id)?.length ?? 0) === 0)

  const legacyVariants =
    missingIds.length > 0 ? await findLegacyVariantsByPublicationIds(missingIds) : new Map()

  for (const publicationId of uniqueIds) {
    const offerRows = offerVariants.get(publicationId) ?? []
    if (offerRows.length > 0) {
      const snapshot = mapOfferVariantsToCommercialSnapshot(publicationId, offerRows, 'offer')
      if (snapshot) snapshots.set(publicationId, snapshot)
      continue
    }

    const legacyRows = legacyVariants.get(publicationId) ?? []
    if (legacyRows.length > 0) {
      const snapshot = mapOfferVariantsToCommercialSnapshot(publicationId, legacyRows, 'legacy')
      if (snapshot) snapshots.set(publicationId, snapshot)
    }
  }

  return snapshots
}
