import {
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_SALES_PATH,
  VENDOR_LISTINGS_PATH,
  VENDOR_SALES_PATH,
} from '@/shared/routing/routes'

import type { Notification } from './types'

/** Dev/test fixtures only — production uses Supabase `notification` + Realtime. */
const MOCK_USER = '00000000-0000-0000-0000-000000000001'

export const VENDOR_NOTIFICATIONS_MOCK: Notification[] = [
  {
    id: 'vn-1',
    userId: MOCK_USER,
    type: 'sale_created',
    audience: 'vendor',
    target: 'seller',
    title: 'Vendiste Tomates Cherry x3',
    body: 'Pedido #1042 · Pago pendiente de confirmación',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    readState: 'unread',
    href: VENDOR_SALES_PATH,
  },
  {
    id: 'vn-2',
    userId: MOCK_USER,
    type: 'order_new',
    audience: 'vendor',
    target: 'seller',
    title: 'Nuevo pedido recibido',
    body: 'María G. compró 2 productos de tu tienda',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readState: 'unread',
    href: VENDOR_SALES_PATH,
  },
  {
    id: 'vn-3',
    userId: MOCK_USER,
    type: 'listing_approved',
    audience: 'vendor',
    target: 'seller',
    title: 'Tu listing fue aprobado',
    body: '“Huevos orgánicos docena” ya está visible en el marketplace',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    readState: 'read',
    href: VENDOR_LISTINGS_PATH,
  },
]

export const BUYER_NOTIFICATIONS_MOCK: Notification[] = [
  {
    id: 'bn-1',
    userId: MOCK_USER,
    type: 'order_status',
    audience: 'buyer',
    target: 'buyer',
    title: 'Tu pedido está en camino',
    body: 'El vendedor preparó tu compra. Llega hoy entre 18:00 y 20:00',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    readState: 'unread',
    href: PROFILE_SALES_PATH,
  },
  {
    id: 'bn-2',
    userId: MOCK_USER,
    type: 'promotion',
    audience: 'buyer',
    target: 'buyer',
    title: '10% off en verduras de estación',
    body: 'Válido hasta el domingo en productos seleccionados',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    readState: 'unread',
    href: PROFILE_NOTIFICATIONS_PATH,
  },
]
