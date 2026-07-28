import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/shared/database/supabase/server'
import type { Database } from '@/shared/types/supabase'
import type {
  TelegramConnectionStatus,
  UserTelegramSettings,
} from '@/domains/dittobots/domain/vendor-telegram-settings'
import { defaultUserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

/**
 * Request-scoped (RLS-aware) server client, used by Server Components and actions.
 * Matches the `@supabase/ssr` client instance returned by `lib/supabase/server`.
 */
export type TelegramDbClient = Awaited<ReturnType<typeof createClient>>

/**
 * Service-role client (bypasses RLS), used by webhooks and background dispatch.
 * Matches the top-level `@supabase/supabase-js` client from `lib/supabase/service`.
 */
export type TelegramServiceClient = SupabaseClient<Database>

type VendorTelegramRow = Database['public']['Tables']['vendor_telegram']['Row']

function asStatus(value: string | null | undefined): TelegramConnectionStatus {
  if (value === 'pending' || value === 'connected' || value === 'expired') return value
  return 'expired'
}

export function mapUserTelegramRow(row: VendorTelegramRow): UserTelegramSettings {
  return {
    userId: row.user_id,
    storeId: row.user_id,
    chatId: row.chat_id ?? null,
    telegramUserId: row.telegram_user_id ?? null,
    username: row.username ?? null,
    firstName: row.first_name ?? null,
    status: asStatus(row.status),
    enabled: row.enabled,
    connected: Boolean(row.chat_id) && row.status === 'connected',
    connectedAt: row.connected_at ?? null,
    notifyNewOrders: row.notify_new_orders,
    notifyNewReviews: row.notify_new_reviews,
    notifyNewFollowers: row.notify_new_followers,
    notifyLowStock: row.notify_low_stock,
  }
}

/** @deprecated Prefer {@link mapUserTelegramRow}. */
export const mapVendorTelegramRow = mapUserTelegramRow

/**
 * Read Telegram settings for a user using the request-scoped (RLS) client.
 * Returns sensible defaults when the user has never opened the section (no row
 * yet), so callers always get a fully-populated object.
 */
export async function getUserTelegramSettings(
  supabase: TelegramDbClient,
  userId: string,
): Promise<UserTelegramSettings> {
  const { data, error } = await supabase
    .from('vendor_telegram')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? mapUserTelegramRow(data) : defaultUserTelegramSettings(userId)
}

/** @deprecated Prefer {@link getUserTelegramSettings}. */
export async function getVendorTelegramSettings(
  supabase: TelegramDbClient,
  storeId: string,
): Promise<UserTelegramSettings> {
  return getUserTelegramSettings(supabase, storeId)
}

/** Same as {@link getUserTelegramSettings} but for the service-role client. */
export async function getUserTelegramSettingsService(
  service: TelegramServiceClient,
  userId: string,
): Promise<UserTelegramSettings> {
  const { data, error } = await service
    .from('vendor_telegram')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? mapUserTelegramRow(data) : defaultUserTelegramSettings(userId)
}

/** @deprecated Prefer {@link getUserTelegramSettingsService}. */
export async function getVendorTelegramSettingsService(
  service: TelegramServiceClient,
  storeId: string,
): Promise<UserTelegramSettings> {
  return getUserTelegramSettingsService(service, storeId)
}
