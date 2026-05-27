import { LISTING_TYPE_LABELS, LISTING_TYPES, type ListingType } from '@/lib/listing'

export type TabId = ListingType

export interface SearchPayload {
  tab: TabId
  place: string
  dates: string
  guests: string
  /** Only present for "service" tab */
  serviceType?: string
}

const TAB_EMOJI: Record<TabId, string> = {
  product: '🛍️',
  property: '🏠',
  experience: '🎈',
  service: '🛎️',
}

export const TABS: { id: TabId; label: string; emoji: string; isNew?: boolean }[] = LISTING_TYPES.map(
  (id) => ({
    id,
    label: LISTING_TYPE_LABELS[id],
    emoji: TAB_EMOJI[id],
    isNew: id === 'experience' || id === 'service' || id === 'property', 
  })
)

