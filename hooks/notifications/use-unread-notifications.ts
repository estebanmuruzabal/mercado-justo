'use client'

import { useShallow } from 'zustand/react/shallow'

import { useNotificationsStore } from '@/stores/notifications.store'

export function useUnreadNotifications(audience: 'buyer' | 'vendor') {
  return useNotificationsStore(
    useShallow((s) => ({
      unreadCount: s.getUnreadCount(audience),
      bellPulseToken: s.bellPulseToken,
      connectionStatus: s.connectionStatus,
    })),
  )
}

export function useNotificationsList(audience: 'buyer' | 'vendor', limit?: number) {
  const list = useNotificationsStore((s) => s.getNotifications(audience))
  if (limit === undefined) return list
  return list.slice(0, limit)
}
