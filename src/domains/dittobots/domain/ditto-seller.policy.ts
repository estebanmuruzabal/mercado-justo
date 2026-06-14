export class DittoSellerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DittoSellerError'
  }
}

export type DittoSellerStore = {
  id: string
  canSellDittoBots: boolean
  isOfficialDittoBotVendor?: boolean
}

export function isDittoSeller(store: Pick<DittoSellerStore, 'canSellDittoBots'>): boolean {
  return store.canSellDittoBots === true
}

export function assertDittoSeller(store: DittoSellerStore | null | undefined): DittoSellerStore {
  if (!store) {
    throw new DittoSellerError('Necesitás una tienda activa.')
  }
  if (!isDittoSeller(store)) {
    throw new DittoSellerError('Tu tienda no está habilitada como DittoSeller.')
  }
  return store
}

export function assertDittoSellerAssignmentTarget(
  vendor: Pick<DittoSellerStore, 'canSellDittoBots' | 'isOfficialDittoBotVendor'>,
): void {
  if (vendor.isOfficialDittoBotVendor) {
    throw new DittoSellerError('No se puede asignar stock al vendor oficial de catálogo.')
  }
  if (!isDittoSeller(vendor)) {
    throw new DittoSellerError(
      'El vendor destino debe estar habilitado como DittoSeller antes de asignar stock.',
    )
  }
}

export const VENDOR_VISIBLE_INVENTORY_STATUSES = [
  'assigned',
  'reserved',
  'sold',
  'activated',
  'warranty',
  'repair',
] as const

export type VendorVisibleInventoryStatus = (typeof VENDOR_VISIBLE_INVENTORY_STATUSES)[number]

export function isVendorVisibleInventoryStatus(
  status: string,
): status is VendorVisibleInventoryStatus {
  return (VENDOR_VISIBLE_INVENTORY_STATUSES as readonly string[]).includes(status)
}
