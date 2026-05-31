export type NotificationSoundId = 'sale_created' | 'order_new' | 'message' | 'default'

/**
 * Placeholder for future Web Audio / notification sounds.
 * Call from the realtime layer when a new notification arrives.
 */
export function queueNotificationSound(soundId: NotificationSoundId): void {
  void soundId
  // Intentionally no-op until product enables sounds.
}

export function soundIdForNotificationType(type: string): NotificationSoundId {
  if (type === 'sale_created' || type === 'order_sale') return 'sale_created'
  if (type === 'order_new') return 'order_new'
  if (type === 'chat_message' || type === 'message') return 'message'
  return 'default'
}
