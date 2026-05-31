import { notifyVendorNewOrder } from '@/domains/dittobots/infrastructure/telegram-notifications.service'
import {
  sendDeliveryIncidentEmail,
  sendModerationAlertEmail,
  sendOrderCreatedEmail,
  sendVendorApprovedEmail,
} from '@/shared/email/services'

import type { AppNotificationEventType, NotificationEventHandler } from '@/shared/events/types'

/**
 * Event handler registry — domains register side-effects here.
 * shared/events must not import server/* legacy paths.
 */
export const NOTIFICATION_EVENT_HANDLERS: {
  [K in AppNotificationEventType]: NotificationEventHandler<K>[]
} = {
  'order.created': [
    async (payload) => {
      await notifyVendorNewOrder(payload.orderId)
    },
    async (payload) => {
      await sendOrderCreatedEmail(payload.orderId)
    },
  ],
  'order.delivered': [],
  'vendor.approved': [
    async (payload) => {
      await sendVendorApprovedEmail(payload.storeId)
    },
  ],
  'moderation.reported': [
    async (payload) => {
      await sendModerationAlertEmail(payload)
    },
  ],
  'shipment.delayed': [
    async (payload) => {
      await sendDeliveryIncidentEmail(payload)
    },
  ],
  'payout.sent': [],
  'marketplace.review.created': [],
  'marketplace.transaction.confirmed': [
    async (payload) => {
      await notifyVendorNewOrder(payload.transactionId)
    },
    async (payload) => {
      await sendOrderCreatedEmail(payload.transactionId)
    },
  ],
  'marketplace.publication.published': [],
}
