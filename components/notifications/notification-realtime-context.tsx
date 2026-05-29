'use client'

import { createContext, useContext } from 'react'

import type { NotificationConnectionStatus } from '@/lib/notifications/types'

export type NotificationRealtimeContextValue = {
  connectionStatus: NotificationConnectionStatus
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (audience: 'buyer' | 'vendor') => Promise<void>
}

const NotificationRealtimeContext = createContext<NotificationRealtimeContextValue | null>(null)

export function NotificationRealtimeContextProvider({
  value,
  children,
}: {
  value: NotificationRealtimeContextValue
  children: React.ReactNode
}) {
  return (
    <NotificationRealtimeContext.Provider value={value}>
      {children}
    </NotificationRealtimeContext.Provider>
  )
}

export function useNotificationRealtimeContext() {
  const ctx = useContext(NotificationRealtimeContext)
  if (!ctx) {
    throw new Error('useNotificationRealtimeContext must be used within NotificationRealtimeProvider')
  }
  return ctx
}
