/**
 * Domain notification events. Handlers react per channel (email, Telegram, …).
 *
 * Adding a new event: extend the map, register handlers in dispatch.ts.
 */

export interface OrderCreatedPayload {
  orderId: string
}

export interface OrderDeliveredPayload {
  orderId: string
}

export interface VendorApprovedPayload {
  storeId: string
}

export interface ModerationReportedPayload {
  userId: string
  entityType: string
  entityTitle: string
  reason: string
  actionUrl: string
}

export interface ShipmentDelayedPayload {
  orderId: string
  incidentDescription: string
}

export interface PayoutSentPayload {
  userId: string
  amount: string
  payoutUrl: string
}

export interface MarketplaceReviewCreatedPayload {
  publicationId: string
  reviewId: string
  authorId: string
}

export interface MarketplaceTransactionConfirmedPayload {
  transactionId: string
  kind: string
  buyerId: string
  sellerId: string
}

export interface MarketplacePublicationPublishedPayload {
  publicationId: string
  ownerId: string
}

export interface AppNotificationEventMap {
  'order.created': OrderCreatedPayload
  'order.delivered': OrderDeliveredPayload
  'vendor.approved': VendorApprovedPayload
  'moderation.reported': ModerationReportedPayload
  'shipment.delayed': ShipmentDelayedPayload
  'payout.sent': PayoutSentPayload
  'marketplace.review.created': MarketplaceReviewCreatedPayload
  'marketplace.transaction.confirmed': MarketplaceTransactionConfirmedPayload
  'marketplace.publication.published': MarketplacePublicationPublishedPayload
}

export type AppNotificationEventType = keyof AppNotificationEventMap

/** Discriminated union used by the dispatcher and app callers. */
export type AppNotificationEvent = {
  [K in AppNotificationEventType]: { type: K; payload: AppNotificationEventMap[K] }
}[AppNotificationEventType]

export type NotificationEventHandler<K extends AppNotificationEventType = AppNotificationEventType> = (
  payload: AppNotificationEventMap[K],
) => Promise<void>
