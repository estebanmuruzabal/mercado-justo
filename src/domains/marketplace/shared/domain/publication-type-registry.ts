import {
  PUBLICATION_CAPABILITIES,
  type PublicationCapability,
} from './capabilities'

export const DITTO_ECOSYSTEMS = ['market', 'world', 'life', 'finance', 'community', 'bots'] as const

export type DittoEcosystem = (typeof DITTO_ECOSYSTEMS)[number]

export const OFFER_MODELS = ['fixed', 'hourly', 'subscription', 'free', 'negotiable', 'none'] as const

export type OfferModel = (typeof OFFER_MODELS)[number]

export type PublicationTypeDefinition = {
  code: string
  displayName: string
  ecosystem: DittoEcosystem
  capabilities: readonly PublicationCapability[]
  defaultOfferModel: OfferModel
  /** When false, type is shown in UI but not persistable until DB/registry enables it. */
  isPersistable: boolean
  isActive: boolean
  schemaVersion: number
}

const cap = PUBLICATION_CAPABILITIES

/** Canonical type registry — extend here without ALTER TYPE on Postgres enum. */
export const PUBLICATION_TYPE_REGISTRY = {
  product: {
    code: 'product',
    displayName: 'Productos',
    ecosystem: 'market',
    capabilities: [cap.TRANSACTABLE, cap.HAS_VARIANTS, cap.STOCK, cap.GEOLOCATED, cap.REVIEWABLE],
    defaultOfferModel: 'fixed',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  service: {
    code: 'service',
    displayName: 'Servicios',
    ecosystem: 'market',
    capabilities: [cap.TRANSACTABLE, cap.HOURLY, cap.GEOLOCATED, cap.REVIEWABLE],
    defaultOfferModel: 'hourly',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  property: {
    code: 'property',
    displayName: 'Propiedades',
    ecosystem: 'market',
    capabilities: [cap.TRANSACTABLE, cap.GEOLOCATED, cap.REVIEWABLE],
    defaultOfferModel: 'negotiable',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  experience: {
    code: 'experience',
    displayName: 'Experiencias',
    ecosystem: 'world',
    capabilities: [cap.TRANSACTABLE, cap.BOOKING, cap.GEOLOCATED, cap.REVIEWABLE, cap.DATETIME],
    defaultOfferModel: 'fixed',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  event: {
    code: 'event',
    displayName: 'Eventos',
    ecosystem: 'world',
    capabilities: [cap.TRANSACTABLE, cap.BOOKING, cap.DATETIME, cap.GEOLOCATED, cap.REVIEWABLE],
    defaultOfferModel: 'fixed',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  recipe: {
    code: 'recipe',
    /** Ditto Protocol — Grower network; not marketplace gastronomy. */
    displayName: 'Protocolos',
    ecosystem: 'bots',
    capabilities: [cap.REVIEWABLE, cap.COMPOSABLE, cap.FOLLOWABLE],
    defaultOfferModel: 'none',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  job: {
    code: 'job',
    displayName: 'Empleos',
    ecosystem: 'life',
    capabilities: [cap.APPLICATION_FLOW, cap.GEOLOCATED],
    defaultOfferModel: 'none',
    isPersistable: false,
    isActive: true,
    schemaVersion: 1,
  },
  project: {
    code: 'project',
    displayName: 'Proyectos',
    ecosystem: 'world',
    capabilities: [cap.FOLLOWABLE, cap.COMPOSABLE, cap.REVIEWABLE],
    defaultOfferModel: 'negotiable',
    isPersistable: true,
    isActive: true,
    schemaVersion: 1,
  },
  channel: {
    code: 'channel',
    displayName: 'Canales',
    ecosystem: 'community',
    capabilities: [cap.FOLLOWABLE],
    defaultOfferModel: 'none',
    isPersistable: false,
    isActive: true,
    schemaVersion: 1,
  },
  dittobot: {
    code: 'dittobot',
    displayName: 'DittoBots',
    ecosystem: 'bots',
    capabilities: [cap.FOLLOWABLE],
    defaultOfferModel: 'subscription',
    isPersistable: false,
    isActive: true,
    schemaVersion: 1,
  },
  resource: {
    code: 'resource',
    displayName: 'Recursos',
    ecosystem: 'life',
    capabilities: [cap.DOWNLOADABLE, cap.REVIEWABLE],
    defaultOfferModel: 'free',
    isPersistable: false,
    isActive: true,
    schemaVersion: 1,
  },
  alliance: {
    code: 'alliance',
    displayName: 'Alianzas',
    ecosystem: 'world',
    capabilities: [cap.FOLLOWABLE],
    defaultOfferModel: 'none',
    isPersistable: false,
    isActive: true,
    schemaVersion: 1,
  },
} as const satisfies Record<string, PublicationTypeDefinition>

export type PublicationTypeCode = keyof typeof PUBLICATION_TYPE_REGISTRY

export const ALL_PUBLICATION_TYPE_CODES = Object.keys(
  PUBLICATION_TYPE_REGISTRY,
) as PublicationTypeCode[]

export const PERSISTABLE_PUBLICATION_TYPES = ALL_PUBLICATION_TYPE_CODES.filter(
  (code) => PUBLICATION_TYPE_REGISTRY[code].isPersistable,
)

/** Types backed by legacy Postgres listing_type enum today. */
export const LEGACY_DB_LISTING_TYPES = ['product', 'property', 'service'] as const

export type LegacyDbListingType = (typeof LEGACY_DB_LISTING_TYPES)[number]

export function isPublicationTypeCode(code: string): code is PublicationTypeCode {
  return Object.prototype.hasOwnProperty.call(PUBLICATION_TYPE_REGISTRY, code)
}

export function getPublicationTypeDefinition(code: string): PublicationTypeDefinition | undefined {
  if (!isPublicationTypeCode(code)) return undefined
  return PUBLICATION_TYPE_REGISTRY[code]
}

export function getPublicationTypeLabel(code: string): string {
  return getPublicationTypeDefinition(code)?.displayName ?? code
}

export function isPersistablePublicationType(code: string): boolean {
  return getPublicationTypeDefinition(code)?.isPersistable ?? false
}

export function isLegacyDbListingType(value: string): value is LegacyDbListingType {
  return (LEGACY_DB_LISTING_TYPES as readonly string[]).includes(value)
}

/** UI filter types: all active registry entries. */
export const UI_PUBLICATION_TYPES = ALL_PUBLICATION_TYPE_CODES.filter(
  (code) => PUBLICATION_TYPE_REGISTRY[code].isActive,
)

export const UI_PUBLICATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  UI_PUBLICATION_TYPES.map((code) => [code, PUBLICATION_TYPE_REGISTRY[code].displayName]),
)
