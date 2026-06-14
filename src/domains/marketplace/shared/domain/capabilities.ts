/** Capability flags for publication types — drives UI, checkout, and policies. */
export const PUBLICATION_CAPABILITIES = {
  TRANSACTABLE: 'transactable',
  REVIEWABLE: 'reviewable',
  GEOLOCATED: 'geolocated',
  HAS_VARIANTS: 'has_variants',
  STOCK: 'stock',
  HOURLY: 'hourly',
  BOOKING: 'booking',
  DATETIME: 'datetime',
  COMPOSABLE: 'composable',
  FOLLOWABLE: 'followable',
  DOWNLOADABLE: 'downloadable',
  APPLICATION_FLOW: 'application_flow',
} as const

export type PublicationCapability =
  (typeof PUBLICATION_CAPABILITIES)[keyof typeof PUBLICATION_CAPABILITIES]

export function hasCapability(
  capabilities: readonly PublicationCapability[],
  cap: PublicationCapability,
): boolean {
  return capabilities.includes(cap)
}
