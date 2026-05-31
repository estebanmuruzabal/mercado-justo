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
