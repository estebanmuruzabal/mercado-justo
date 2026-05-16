import type { ListingType } from '@/lib/listing'

export type NavbarListingType = ListingType

export const NAVBAR_TABS: Array<{ id: NavbarListingType; label: string }> = [
  { id: 'product', label: 'Productos' },
  { id: 'property', label: 'Propiedades' },
  { id: 'experience', label: 'Experiencias' },
  { id: 'service', label: 'Servicios' },
]

