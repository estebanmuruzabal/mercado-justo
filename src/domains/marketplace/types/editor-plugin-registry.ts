import type { PublicationTypeCode } from '@/domains/marketplace/shared/domain/publication-type-registry'

export type PublicationEditorPlugin = {
  typeCode: PublicationTypeCode
  /** Presentation component path — resolved at build time by importers. */
  editorModule: string
  detailModule: string
  cardModule: string
}

/** Registry of type-specific presentation plugins (Phase 4-5). */
export const PUBLICATION_EDITOR_PLUGINS: Partial<Record<PublicationTypeCode, PublicationEditorPlugin>> = {
  product: {
    typeCode: 'product',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  service: {
    typeCode: 'service',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  property: {
    typeCode: 'property',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  experience: {
    typeCode: 'experience',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  event: {
    typeCode: 'event',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  recipe: {
    typeCode: 'recipe',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  job: {
    typeCode: 'job',
    editorModule: '@/domains/marketplace/types/definitions/job.editor',
    detailModule: '@/domains/marketplace/types/definitions/job.detail',
    cardModule: '@/domains/marketplace/types/definitions/job.card',
  },
  project: {
    typeCode: 'project',
    editorModule: '@/domains/marketplace/listings/presentation/components/ListingManager',
    detailModule: '@/domains/marketplace/listings/presentation/components/detail/ProductDetailClient',
    cardModule: '@/domains/marketplace/listings/presentation/home/homepage/listing-card',
  },
  channel: {
    typeCode: 'channel',
    editorModule: '@/domains/marketplace/types/definitions/channel.editor',
    detailModule: '@/domains/marketplace/types/definitions/channel.detail',
    cardModule: '@/domains/marketplace/types/definitions/channel.card',
  },
  dittobot: {
    typeCode: 'dittobot',
    editorModule: '@/domains/marketplace/types/definitions/dittobot.editor',
    detailModule: '@/domains/marketplace/types/definitions/dittobot.detail',
    cardModule: '@/domains/marketplace/types/definitions/dittobot.card',
  },
  resource: {
    typeCode: 'resource',
    editorModule: '@/domains/marketplace/types/definitions/resource.editor',
    detailModule: '@/domains/marketplace/types/definitions/resource.detail',
    cardModule: '@/domains/marketplace/types/definitions/resource.card',
  },
  alliance: {
    typeCode: 'alliance',
    editorModule: '@/domains/marketplace/types/definitions/alliance.editor',
    detailModule: '@/domains/marketplace/types/definitions/alliance.detail',
    cardModule: '@/domains/marketplace/types/definitions/alliance.card',
  },
}

export function getEditorPlugin(typeCode: string): PublicationEditorPlugin | undefined {
  return PUBLICATION_EDITOR_PLUGINS[typeCode as PublicationTypeCode]
}
