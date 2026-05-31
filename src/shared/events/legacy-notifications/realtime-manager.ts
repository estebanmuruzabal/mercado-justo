import type { RealtimeChannel } from '@supabase/supabase-js'

import { createClient } from '@/shared/database/supabase/client'
import { mapNotificationRow } from '@/shared/events/legacy-notifications/map-notification-row'
import type { NotificationConnectionStatus, NotificationRowPayload } from '@/shared/events/legacy-notifications/types'
import { queueNotificationSound, soundIdForNotificationType } from '@/shared/events/legacy-notifications/sound'

export type RealtimeNotificationHandlers = {
  onStatus: (status: NotificationConnectionStatus) => void
  onHydrated: (rows: ReturnType<typeof mapNotificationRow>[]) => void
  onInsert: (notification: ReturnType<typeof mapNotificationRow>) => void
  onUpdate: (notification: ReturnType<typeof mapNotificationRow>) => void
  onDelete: (id: string) => void
}

type SubscriptionEntry = {
  userId: string
  channel: RealtimeChannel
  refCount: number
}

let entry: SubscriptionEntry | null = null

function mapChannelStatus(status: string): NotificationConnectionStatus {
  switch (status) {
    case 'SUBSCRIBED':
      return 'connected'
    case 'TIMED_OUT':
      return 'reconnecting'
    case 'CLOSED':
    case 'CHANNEL_ERROR':
      return 'disconnected'
    default:
      return 'reconnecting'
  }
}

async function fetchInitialNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notification')
    .select('id, user_id, audience, type, title, body, read, href, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []).map((row) => mapNotificationRow(row as NotificationRowPayload))
}

export async function subscribeToUserNotifications(
  userId: string,
  handlers: RealtimeNotificationHandlers,
): Promise<() => void> {
  if (entry?.userId === userId) {
    entry.refCount += 1
    return () => releaseNotificationSubscription()
  }

  await teardownNotificationSubscription()

  handlers.onStatus('loading')

  let initialRows: ReturnType<typeof mapNotificationRow>[] = []
  try {
    initialRows = await fetchInitialNotifications(userId)
    handlers.onHydrated(initialRows)
  } catch {
    handlers.onStatus('disconnected')
    return () => undefined
  }

  const supabase = createClient()
  const channel = supabase
    .channel(`notifications:${userId}`, {
      config: { broadcast: { self: false } },
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as NotificationRowPayload
        const notification = mapNotificationRow(row)
        queueNotificationSound(soundIdForNotificationType(notification.type))
        handlers.onInsert(notification)
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as NotificationRowPayload
        handlers.onUpdate(mapNotificationRow(row))
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const old = payload.old as { id?: string }
        if (old.id) handlers.onDelete(old.id)
      },
    )
    .subscribe((status) => {
      handlers.onStatus(mapChannelStatus(status))
    })

  entry = { userId, channel, refCount: 1 }
  return () => releaseNotificationSubscription()
}

function releaseNotificationSubscription() {
  if (!entry) return
  entry.refCount -= 1
  if (entry.refCount <= 0) {
    void teardownNotificationSubscription()
  }
}

async function teardownNotificationSubscription() {
  if (!entry) return
  const supabase = createClient()
  await supabase.removeChannel(entry.channel)
  entry = null
}

export function resetNotificationSubscriptionForTests() {
  entry = null
}
