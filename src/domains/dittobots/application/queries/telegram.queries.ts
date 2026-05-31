import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/shared/database/supabase/server'
import type { Database } from '@/shared/types/supabase'
import type { VendorTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'
import { defaultVendorTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

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

export function mapVendorTelegramRow(row: VendorTelegramRow): VendorTelegramSettings {
  return {
    storeId: row.store_id,
    chatId: row.chat_id ?? null,
    username: row.username ?? null,
    enabled: row.enabled,
    connected: Boolean(row.chat_id),
    connectedAt: row.connected_at ?? null,
    notifyNewOrders: row.notify_new_orders,
    notifyNewReviews: row.notify_new_reviews,
    notifyNewFollowers: row.notify_new_followers,
    notifyLowStock: row.notify_low_stock,
  }
}

/**
 * Read the Telegram settings for a store using the request-scoped (RLS) client.
 * Returns sensible defaults when the vendor has never opened the section (no row
 * yet), so callers always get a fully-populated object.
 */
export async function getVendorTelegramSettings(
  supabase: TelegramDbClient,
  storeId: string,
): Promise<VendorTelegramSettings> {
  const { data, error } = await supabase
    .from('vendor_telegram')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) throw error
  return data ? mapVendorTelegramRow(data) : defaultVendorTelegramSettings(storeId)
}

/** Same as {@link getVendorTelegramSettings} but for the service-role client. */
export async function getVendorTelegramSettingsService(
  service: TelegramServiceClient,
  storeId: string,
): Promise<VendorTelegramSettings> {
  const { data, error } = await service
    .from('vendor_telegram')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) throw error
  return data ? mapVendorTelegramRow(data) : defaultVendorTelegramSettings(storeId)
}
