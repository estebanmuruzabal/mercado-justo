import type { Publication } from '../../domain/entities/publication'

/** Read-model DTO for UI and API — decoupled from persistence row shape. */
export type PublicationDto = {
  id: string
  publicationType: string
  publicationTypeLabel: string
  kind: string
  /** @deprecated Use structuralRole */
  structuralRole: string
  title: string
  summary: string | null
  lifecycle: string
  visibility: string
  moderationStatus: string
  ownerId: string
  taxonomyNodeId: string
  isTransactable: boolean
  latitude: number | null
  longitude: number | null
  createdAt: string
}

export function toPublicationDto(
  pub: Publication,
  typeLabel: string,
): PublicationDto {
  return {
    id: pub.id,
    publicationType: pub.publicationType,
    publicationTypeLabel: typeLabel,
    kind: pub.structuralRole,
    structuralRole: pub.structuralRole,
    title: pub.title ?? '',
    summary: pub.summary,
    lifecycle: pub.lifecycle,
    visibility: pub.visibility,
    moderationStatus: pub.moderationStatus,
    ownerId: pub.owner.ownerId,
    taxonomyNodeId: pub.taxonomyNodeId,
    isTransactable: pub.isTransactable,
    latitude: pub.location.latitude,
    longitude: pub.location.longitude,
    createdAt: pub.createdAt,
  }
}
