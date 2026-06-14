/**
 * Admin domain types shared by the pure engines and the admin UI/queries.
 * Kept framework-free so engines stay testable in isolation.
 */

// ——— Shipment / fulfillment ———
export const SHIPMENT_STATUSES = [
  'pending',
  'preparing',
  'ready_for_pickup',
  'in_transit',
  'delivered',
  'cancelled',
  'incident',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export type DeliveryMethod = 'pickup' | 'own_delivery' | 'mj_delivery'

export type ScheduledWindow = {
  date?: string
  start?: string
  end?: string
}

export const FULFILLMENT_METHOD_KINDS = ['pickup', 'delivery'] as const
export type FulfillmentMethodKind = (typeof FULFILLMENT_METHOD_KINDS)[number]

export const FULFILLMENT_METHOD_PROVIDERS = ['seller', 'dittovan'] as const
export type FulfillmentMethodProvider = (typeof FULFILLMENT_METHOD_PROVIDERS)[number]

export const FULFILLMENT_METHOD_CODES = [
  'pickup_seller',
  'pickup_dittovan',
  'delivery_seller',
  'delivery_dittovan',
] as const
export type FulfillmentMethodCode = (typeof FULFILLMENT_METHOD_CODES)[number]

export type FulfillmentRequestStatus = ShipmentStatus

export type FulfillmentMethodRow = {
  code: FulfillmentMethodCode
  label: string
  kind: FulfillmentMethodKind
  provider: FulfillmentMethodProvider
  sortOrder: number
  isActive: boolean
}

export type FulfillmentWindowRow = {
  id: string
  vendorId: string | null
  code: string
  label: string
  dayOfWeek: number | null
  startTime: string
  endTime: string
  timezone: string
  sortOrder: number
  isActive: boolean
}

/** Platform or vendor pickup window. */
export type PickupWindowRow = FulfillmentWindowRow

/** Platform or vendor delivery window. */
export type DeliveryWindowRow = FulfillmentWindowRow

export type VendorFulfillmentPreferences = {
  autoUseStoreAddressForPickup: boolean
  requireBuyerConfirmation: boolean
  allowSameDayPickup: boolean
  allowSameDayDelivery: boolean
  minimumPreparationMinutes: number | null
  notes: string | null
}

export type VendorFulfillmentSettings = {
  vendorId: string
  enabledMethodCodes: FulfillmentMethodCode[]
  enabledPickupWindowIds: string[]
  enabledDeliveryWindowIds: string[]
  deliveryRadiusKm: number | null
  pickupAddress: string | null
  defaultMethodCode: FulfillmentMethodCode | null
  preferences: VendorFulfillmentPreferences
  createdAt: string
  updatedAt: string
}

export type FulfillmentBatchRow = {
  id: string
  code: string
  status: BatchStatus
  scheduledWindow: ScheduledWindow | null
  createdBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FulfillmentRequestRow = {
  id: string
  shipmentId: string
  orderId: string
  vendorId: string
  vendorName: string
  buyerId: string
  methodCode: FulfillmentMethodCode
  methodLabel: string
  methodKind: FulfillmentMethodKind
  methodProvider: FulfillmentMethodProvider
  status: FulfillmentRequestStatus
  pickupWindowId: string | null
  pickupWindowLabel: string | null
  scheduledWindow: ScheduledWindow | null
  pickupAddress: string | null
  deliveryAddress: string | null
  assignedOperatorId: string | null
  batchId: string | null
  batchCode: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FulfillmentBatchingCandidate = {
  key: string
  label: string
  methodProvider: FulfillmentMethodProvider
  requestCount: number
  vendorCount: number
  vendorNames: string[]
  requestIds: string[]
  scheduledWindow: ScheduledWindow | null
}

export type LogisticsDashboardStats = {
  activeDeliveries: number
  totalMercadoJusto: number
  totalDeliveryPropio: number
  totalPickup: number
  pickupWindowsConfigured: number
  batchingCandidates: number
}

// ——— Sustainability ———
export const CARBON_LEVELS = ['very_low', 'low', 'medium', 'high'] as const
export type CarbonLevel = (typeof CARBON_LEVELS)[number]

// ——— Moderation ———
export const LISTING_MODERATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'hidden',
] as const
export type ListingModerationStatus = (typeof LISTING_MODERATION_STATUSES)[number]

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export type ModerationEntityType = 'listing' | 'vendor' | 'review' | 'profile'

// ——— Delivery batches ———
export const BATCH_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
] as const
export type BatchStatus = (typeof BATCH_STATUSES)[number]

// ——— Vendor lifecycle ———
export const VENDOR_STATUSES = ['active', 'suspended', 'pending_review'] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

// ——— Platform user lifecycle ———
export const USER_STATUSES = ['active', 'suspended', 'banned'] as const
export type UserStatus = (typeof USER_STATUSES)[number]
