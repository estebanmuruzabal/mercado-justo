import type { ListingType } from '@/lib/listing'
import type { CharacteristicMap } from '@/lib/product'

export type ModalStep = 1 | 2 | 3

export type DraftFormState = {
  listingId: string | null
  listingType: ListingType | null
  categoryId: string | null
  categoryPath: string[]

  // Base fields
  title: string
  description: string
  condition: 'new' | 'used'
  stock: number
  latitude: number | null
  longitude: number | null

  // Category-specific
  characteristics: CharacteristicMap

  // Variants toggle
  enableVariants: boolean

  // Simple mode (no variants)
  simplePrice: number | null
  simpleSku: string | null

  // Used for legacy publishing (derived from variants when enableVariants=true)
  price: number | null
  status: 'draft' | 'published'
}

