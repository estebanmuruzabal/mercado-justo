export const DITTO_BOT_INVENTORY_STATUSES = [
  'available',
  'assigned',
  'reserved',
  'sold',
  'activated',
  'warranty',
  'repair',
  'retired',
] as const

export type DittoBotInventoryStatus = (typeof DITTO_BOT_INVENTORY_STATUSES)[number]

export type DeviceLocation = {
  lat: number | null
  lng: number | null
  region: string | null
}

export type UserLocation = DeviceLocation

export type DittoBotInventoryUnit = {
  id: string
  serialNumber: string
  activationCode: string
  model: string
  subtype: string | null
  status: DittoBotInventoryStatus
  ownerUserId: string | null
  soldAt: string | null
  activatedAt: string | null
  location: DeviceLocation
  inheritsUserLocation: boolean
  isPublicOnMap: boolean
  friendlyName: string | null
  createdAt: string
  updatedAt: string
}

/** Client-safe summary — excludes activation_code. */
export type DittoBotInventoryUnitSummary = Omit<DittoBotInventoryUnit, 'activationCode'>

/** Admin inventory row with R6.0c traceability fields. */
export type DittoBotInventoryUnitAdmin = DittoBotInventoryUnit & {
  productId: string | null
  productTitle: string | null
  batchId: string | null
  firmwareVersion: string | null
  manufacturerVendorId: string | null
  assignedVendorId: string | null
  assignedVendorName: string | null
  assignedAt: string | null
  sellerVendorId: string | null
}

export function emptyDeviceLocation(): DeviceLocation {
  return { lat: null, lng: null, region: null }
}

export function isActivatedUnit(unit: Pick<DittoBotInventoryUnit, 'status'>): boolean {
  return unit.status === 'activated'
}
