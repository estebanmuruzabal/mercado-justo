'use client'

import { useNotificationRealtimeContext } from '@/domains/community/notifications/presentation/components/notifications/notification-realtime-context'
import { useNotificationsStore } from '@/domains/community/notifications/presentation/stores/notifications.store'

export function useNotificationsRealtime() {
  const { connectionStatus, markAsRead, markAllAsRead } = useNotificationRealtimeContext()
  const hydrated = useNotificationsStore((s) => s.hydrated)

  return {
    connectionStatus,
    hydrated,
    isLoading: connectionStatus === 'loading' || (connectionStatus === 'connected' && !hydrated),
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting',
    isDisconnected: connectionStatus === 'disconnected',
    markAsRead,
    markAllAsRead,
  }
}
