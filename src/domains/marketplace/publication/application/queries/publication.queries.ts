import { getPublicationTypeLabel } from '@/domains/marketplace/shared/domain/publication-type-registry'
import {
  getPublicationById,
  listPublicationsByStore,
} from '../../infrastructure/publication.repository'
import { toPublicationDto, type PublicationDto } from '../dto/publication.dto'

export async function fetchPublicationById(id: string): Promise<PublicationDto | null> {
  const pub = await getPublicationById(id)
  if (!pub) return null
  return toPublicationDto(pub, getPublicationTypeLabel(pub.publicationType))
}

export async function fetchPublicationsByStore(storeId: string): Promise<PublicationDto[]> {
  const pubs = await listPublicationsByStore(storeId)
  return pubs.map((pub) => toPublicationDto(pub, getPublicationTypeLabel(pub.publicationType)))
}
