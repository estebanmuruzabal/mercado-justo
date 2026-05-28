'use client'

import { create } from 'zustand'

import { audienceToStoreKey } from '@/lib/notifications/map-notification-row'
import type {
  Notification,
  NotificationConnectionStatus,
  NotificationReadState,
} from '@/lib/notifications/types'

type NotificationsState = {
  buyerNotifications: Notification[]
  vendorNotifications: Notification[]
  connectionStatus: NotificationConnectionStatus
  hydrated: boolean
  bellPulseToken: number
  setConnectionStatus: (status: NotificationConnectionStatus) => void
  hydrateFromServer: (notifications: Notification[]) => void
  resetNotifications: () => void
  upsertNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  setReadState: (id: string, readState: NotificationReadState) => void
  markAllRead: (audience: 'buyer' | 'vendor') => void
  pulseBell: () => void
  getUnreadCount: (audience: 'buyer' | 'vendor') => number
  getNotifications: (audience: 'buyer' | 'vendor') => Notification[]
}

const INITIAL_STATUS: NotificationConnectionStatus = 'idle'

function patchList(
  list: Notification[],
  id: string,
  readState: NotificationReadState,
): Notification[] {
  return list.map((n) => (n.id === id ? { ...n, readState } : n))
}

function upsertInList(list: Notification[], notification: Notification): Notification[] {
  const idx = list.findIndex((n) => n.id === notification.id)
  if (idx === -1) {
    return [notification, ...list]
  }
  const next = [...list]
  next[idx] = notification
  return next
}

function removeFromList(list: Notification[], id: string): Notification[] {
  return list.filter((n) => n.id !== id)
}

function splitByAudience(notifications: Notification[]) {
  const buyer: Notification[] = []
  const vendor: Notification[] = []
  for (const n of notifications) {
    const key = audienceToStoreKey(n.audience)
    if (key === 'buyer') buyer.push(n)
    else vendor.push(n)
  }
  return { buyer, vendor }
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  buyerNotifications: [],
  vendorNotifications: [],
  connectionStatus: INITIAL_STATUS,
  hydrated: false,
  bellPulseToken: 0,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  hydrateFromServer: (notifications) => {
    const { buyer, vendor } = splitByAudience(notifications)
    set({
      buyerNotifications: buyer,
      vendorNotifications: vendor,
      hydrated: true,
    })
  },

  resetNotifications: () =>
    set({
      buyerNotifications: [],
      vendorNotifications: [],
      connectionStatus: INITIAL_STATUS,
      hydrated: false,
      bellPulseToken: 0,
    }),

  upsertNotification: (notification) =>
    set((state) => {
      const key = audienceToStoreKey(notification.audience)
      const listKey = key === 'buyer' ? 'buyerNotifications' : 'vendorNotifications'
      const list = state[listKey]
      const existed = list.some((n) => n.id === notification.id)
      const nextList = upsertInList(list, notification)
      return {
        [listKey]: nextList,
        bellPulseToken:
          !existed && notification.readState === 'unread'
            ? state.bellPulseToken + 1
            : state.bellPulseToken,
      }
    }),

  removeNotification: (id) =>
    set((state) => ({
      buyerNotifications: removeFromList(state.buyerNotifications, id),
      vendorNotifications: removeFromList(state.vendorNotifications, id),
    })),

  setReadState: (id, readState) =>
    set((state) => ({
      buyerNotifications: patchList(state.buyerNotifications, id, readState),
      vendorNotifications: patchList(state.vendorNotifications, id, readState),
    })),

  markAllRead: (audience) =>
    set((state) => {
      const key = audience === 'buyer' ? 'buyerNotifications' : 'vendorNotifications'
      const list = state[key].map((n) => ({ ...n, readState: 'read' as const }))
      return { [key]: list }
    }),

  pulseBell: () => set((state) => ({ bellPulseToken: state.bellPulseToken + 1 })),

  getUnreadCount: (audience) => {
    const list = get().getNotifications(audience)
    return list.filter((n) => n.readState === 'unread').length
  },

  getNotifications: (audience) =>
    audience === 'buyer' ? get().buyerNotifications : get().vendorNotifications,
}))
