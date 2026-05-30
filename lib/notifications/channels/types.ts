/**
 * Multi-channel notification contracts.
 *
 * Email is implemented today; push and SMS are documented seams for future channels.
 */

export type DeliveryResult = {
  delivered: boolean
  id?: string
  reason?: string
}

export type NotificationChannelId = 'email' | 'telegram' | 'push' | 'sms' | 'in_app'

export interface NotificationChannel<TPayload = unknown> {
  readonly id: NotificationChannelId
  send(payload: TPayload): Promise<DeliveryResult>
}
