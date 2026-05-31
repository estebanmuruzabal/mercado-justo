import type { TelegramNotificationPreferences } from '@/domains/dittobots/domain/vendor-telegram-settings'

import { buildHttpsUrl } from './config'
import {
  bold,
  escapeHtml,
  formatCurrency,
  inlineKeyboard,
  lines,
  urlButton,
} from './messages'
import type { OutboundTelegramMessage } from './types'

/**
 * Central registry of vendor-facing Telegram events.
 *
 * Adding a new notification type is a single, localized change:
 *   1. add a payload interface + entry to {@link VendorTelegramEventMap}
 *   2. map it to a preference key (or null to always send)
 *   3. provide a message builder
 *
 * Dispatch (lib/telegram/notify.ts) reads this registry generically, so callers
 * never duplicate gating/formatting logic. This keeps the system ready for
 * inline buttons, order-state events, smart alerts, analytics, etc.
 */

// ——— Event payloads ———

export interface NewOrderEventPayload {
  orderId: string
  buyerName: string
  items: Array<{ title: string; quantity: number }>
  total: number
}

export interface NewReviewEventPayload {
  vendorSlug: string | null
  authorName: string
  rating: number
  comment: string | null
}

export interface NewFollowerEventPayload {
  followerName: string
  followerCount: number
}

export interface LowStockEventPayload {
  productTitle: string
  stock: number
}

/** Maps each event type to its payload shape. */
export interface VendorTelegramEventMap {
  new_order: NewOrderEventPayload
  new_review: NewReviewEventPayload
  new_follower: NewFollowerEventPayload
  low_stock: LowStockEventPayload
  /** Manual "send test notification" action. Always delivered when connected. */
  test: Record<string, never>
}

export type VendorTelegramEventType = keyof VendorTelegramEventMap

/** Discriminated union used by the dispatcher and app callers. */
export type VendorTelegramEvent = {
  [K in VendorTelegramEventType]: { type: K; payload: VendorTelegramEventMap[K] }
}[VendorTelegramEventType]

interface EventConfig<K extends VendorTelegramEventType> {
  /** Preference flag gating this event, or null to always send (when enabled). */
  prefKey: keyof TelegramNotificationPreferences | null
  build: (payload: VendorTelegramEventMap[K]) => OutboundTelegramMessage
}

type EventRegistry = {
  [K in VendorTelegramEventType]: EventConfig<K>
}

export const VENDOR_TELEGRAM_EVENTS: EventRegistry = {
  new_order: {
    prefKey: 'notifyNewOrders',
    build: (payload) => {
      const itemLines = payload.items.map(
        (item) => `• ${escapeHtml(item.title)} x${item.quantity}`,
      )
      return {
        parseMode: 'HTML',
        text: lines(
          '🔥 ' + bold('Nueva venta'),
          '',
          `Cliente: ${escapeHtml(payload.buyerName)}`,
          ...itemLines,
          `Total: ${bold(formatCurrency(payload.total))}`,
        ),
        inlineKeyboard: inlineKeyboard([
          urlButton('Ver orden', buildHttpsUrl('/dashboard-vendor/ventas')),
        ]),
      }
    },
  },

  new_review: {
    prefKey: 'notifyNewReviews',
    build: (payload) => ({
      parseMode: 'HTML',
      text: lines(
        '⭐ ' + bold('Nueva reseña'),
        '',
        `${escapeHtml(payload.authorName)} dejó ${payload.rating}/5`,
        payload.comment ? `“${escapeHtml(payload.comment)}”` : null,
      ),
      inlineKeyboard: inlineKeyboard([
        urlButton(
          'Ver reseñas',
          payload.vendorSlug ? buildHttpsUrl(`/vendor/${payload.vendorSlug}`) : null,
        ),
      ]),
    }),
  },

  new_follower: {
    prefKey: 'notifyNewFollowers',
    build: (payload) => ({
      parseMode: 'HTML',
      text: lines(
        '👋 ' + bold('Nuevo seguidor'),
        '',
        `${escapeHtml(payload.followerName)} empezó a seguir tu tienda.`,
        `Seguidores: ${bold(String(payload.followerCount))}`,
      ),
    }),
  },

  low_stock: {
    prefKey: 'notifyLowStock',
    build: (payload) => ({
      parseMode: 'HTML',
      text: lines(
        '📦 ' + bold('Stock bajo'),
        '',
        `${escapeHtml(payload.productTitle)} tiene ${bold(String(payload.stock))} unidades.`,
      ),
    }),
  },

  test: {
    prefKey: null,
    build: () => ({
      parseMode: 'HTML',
      text: lines(
        '✅ ' + bold('Notificación de prueba'),
        '',
        'Tu tienda está conectada correctamente a Telegram.',
        'Vas a recibir acá tus alertas de ventas y novedades.',
      ),
    }),
  },
}
