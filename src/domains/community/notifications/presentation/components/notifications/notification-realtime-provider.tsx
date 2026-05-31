'use client'

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'

import { createClient } from '@/shared/database/supabase/client'
import { subscribeToUserNotifications } from '@/shared/events/legacy-notifications/realtime-manager'
import { useNotificationsStore } from '@/domains/community/notifications/presentation/stores/notifications.store'

import { NotificationRealtimeContextProvider } from './notification-realtime-context'

export function NotificationRealtimeProvider({ children }: { children: ReactNode }) {
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined)
  const userIdRef = useRef<string | null>(null)

  const connectionStatus = useNotificationsStore((s) => s.connectionStatus)
  const setConnectionStatus = useNotificationsStore((s) => s.setConnectionStatus)
  const hydrateFromServer = useNotificationsStore((s) => s.hydrateFromServer)
  const resetNotifications = useNotificationsStore((s) => s.resetNotifications)
  const upsertNotification = useNotificationsStore((s) => s.upsertNotification)
  const removeNotification = useNotificationsStore((s) => s.removeNotification)
  const setReadState = useNotificationsStore((s) => s.setReadState)
  const markAllReadLocal = useNotificationsStore((s) => s.markAllRead)

  const teardown = useCallback(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = undefined
    userIdRef.current = null
    resetNotifications()
  }, [resetNotifications])

  useEffect(() => {
    const supabase = createClient()

    const connect = async (userId: string) => {
      if (userIdRef.current === userId && unsubscribeRef.current) return

      teardown()
      userIdRef.current = userId
      setConnectionStatus('loading')

      const unsubscribe = await subscribeToUserNotifications(userId, {
        onStatus: setConnectionStatus,
        onHydrated: hydrateFromServer,
        onInsert: upsertNotification,
        onUpdate: upsertNotification,
        onDelete: removeNotification,
      })

      unsubscribeRef.current = unsubscribe
    }

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        teardown()
        return
      }

      await connect(user.id)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        teardown()
        return
      }
      void connect(session.user.id)
    })

    return () => {
      subscription.unsubscribe()
      teardown()
    }
  }, [
    teardown,
    setConnectionStatus,
    hydrateFromServer,
    upsertNotification,
    removeNotification,
  ])

  const markAsRead = useCallback(
    async (id: string) => {
      setReadState(id, 'read')
      const supabase = createClient()
      const { error } = await supabase
        .from('notification')
        .update({ read: true } as never)
        .eq('id', id)
      if (error) {
        setReadState(id, 'unread')
        throw error
      }
    },
    [setReadState],
  )

  const markAllAsRead = useCallback(
    async (audience: 'buyer' | 'vendor') => {
      const userId = userIdRef.current
      if (!userId) return

      markAllReadLocal(audience)
      const supabase = createClient()
      const { error } = await supabase
        .from('notification')
        .update({ read: true } as never)
        .eq('user_id', userId)
        .eq('audience', audience)
        .eq('read', false)

      if (error) throw error
    },
    [markAllReadLocal],
  )

  const contextValue = useMemo(
    () => ({
      connectionStatus,
      markAsRead,
      markAllAsRead,
    }),
    [connectionStatus, markAsRead, markAllAsRead],
  )

  return (
    <NotificationRealtimeContextProvider value={contextValue}>
      {children}
    </NotificationRealtimeContextProvider>
  )
}
