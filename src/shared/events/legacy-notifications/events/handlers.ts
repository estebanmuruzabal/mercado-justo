import { notifyVendorNewOrder } from '@/domains/dittobots/infrastructure/telegram-notifications.service'
import {
  sendDeliveryIncidentEmail,
  sendModerationAlertEmail,
  sendOrderCreatedEmail,
  sendVendorApprovedEmail,
} from '@/shared/email/services'

import type { AppNotificationEventType, NotificationEventHandler } from './types'

/**
 * Per-event channel handlers. Extend when adding push/SMS/in-app fan-out.
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
}
