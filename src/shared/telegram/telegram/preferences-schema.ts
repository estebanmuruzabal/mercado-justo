import { z } from 'zod'

/**
 * Shared validation schema for vendor Telegram preferences. Imported by both the
 * client form and the server action so the contract stays in a single place.
 */
export const telegramPreferencesSchema = z.object({
  enabled: z.boolean(),
  notifyNewOrders: z.boolean(),
  notifyNewReviews: z.boolean(),
  notifyNewFollowers: z.boolean(),
  notifyLowStock: z.boolean(),
})

export type TelegramPreferencesInput = z.infer<typeof telegramPreferencesSchema>
