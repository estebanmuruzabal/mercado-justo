export type NotificationType =
  | 'sale_created'
  | 'order_new'
  | 'order_sale'
  | 'order_updated'
  | 'order_status'
  | 'listing_approved'
  | 'message'
  | 'chat_message'
  | 'payout'
  | 'payout_sent'
  | 'dispute'
  | 'promotion'
  | 'favorite'
  | 'system'

export type NotificationAudience = 'buyer' | 'vendor'

export type NotificationTarget = 'buyer' | 'seller' | 'both'

export type NotificationReadState = 'unread' | 'read'

export type NotificationConnectionStatus =
  | 'idle'
  | 'loading'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  audience: NotificationAudience
  target: NotificationTarget
  title: string
  body: string
  createdAt: string
  readState: NotificationReadState
  href?: string
  metadata?: Record<string, string | number | boolean>
}

export type NotificationRowPayload = {
  id: string
  user_id: string
  audience: NotificationAudience
  type: string
  title: string
  body: string
  read: boolean
  href: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
