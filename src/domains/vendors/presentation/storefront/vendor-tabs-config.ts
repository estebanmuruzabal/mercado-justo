export const VENDOR_TABS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'productos', label: 'Productos' },
  { id: 'reviews', label: 'Reseñas' },
  { id: 'mapa', label: 'Mapa' },
] as const

export type VendorTabId = (typeof VENDOR_TABS)[number]['id']
