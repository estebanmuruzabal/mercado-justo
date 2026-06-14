import type { createClient } from '@/shared/database/supabase/server'
import {
  normalizeVendorFulfillmentPreferences,
} from '@/domains/logistics/domain/policies/vendor-fulfillment-policy'
import type {
  FulfillmentMethodCode,
  VendorFulfillmentSettings,
} from '@/domains/logistics/domain/types'

type DbClient = Awaited<ReturnType<typeof createClient>>

type VendorFulfillmentSettingsDbRow = {
  vendor_id: string
  enabled_method_codes: string[]
  enabled_pickup_window_ids: string[]
  enabled_delivery_window_ids: string[]
  delivery_radius_km: number | null
  pickup_address: string | null
  default_method_code: string | null
  preferences: unknown
  created_at: string
  updated_at: string
}

export type UpsertVendorFulfillmentSettingsInput = {
  vendorId: string
  enabledMethodCodes: FulfillmentMethodCode[]
  enabledPickupWindowIds: string[]
  enabledDeliveryWindowIds: string[]
  deliveryRadiusKm: number | null
  pickupAddress: string | null
  defaultMethodCode: FulfillmentMethodCode | null
  preferences: VendorFulfillmentSettings['preferences']
}

function mapSettingsRow(row: VendorFulfillmentSettingsDbRow): VendorFulfillmentSettings {
  return {
    vendorId: row.vendor_id,
    enabledMethodCodes: row.enabled_method_codes as FulfillmentMethodCode[],
    enabledPickupWindowIds: row.enabled_pickup_window_ids,
    enabledDeliveryWindowIds: row.enabled_delivery_window_ids,
    deliveryRadiusKm: row.delivery_radius_km,
    pickupAddress: row.pickup_address,
    defaultMethodCode: row.default_method_code as FulfillmentMethodCode | null,
    preferences: normalizeVendorFulfillmentPreferences(row.preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findVendorFulfillmentSettingsByVendorId(
  client: DbClient,
  vendorId: string,
): Promise<VendorFulfillmentSettings | null> {
  const { data, error } = await client
    .from('vendor_fulfillment_settings')
    .select(
      'vendor_id,enabled_method_codes,enabled_pickup_window_ids,enabled_delivery_window_ids,delivery_radius_km,pickup_address,default_method_code,preferences,created_at,updated_at',
    )
    .eq('vendor_id', vendorId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapSettingsRow(data as VendorFulfillmentSettingsDbRow)
}

export async function upsertVendorFulfillmentSettings(
  client: DbClient,
  input: UpsertVendorFulfillmentSettingsInput,
): Promise<VendorFulfillmentSettings> {
  const payload = {
    vendor_id: input.vendorId,
    enabled_method_codes: input.enabledMethodCodes,
    enabled_pickup_window_ids: input.enabledPickupWindowIds,
    enabled_delivery_window_ids: input.enabledDeliveryWindowIds,
    delivery_radius_km: input.deliveryRadiusKm,
    pickup_address: input.pickupAddress,
    default_method_code: input.defaultMethodCode,
    preferences: input.preferences,
  }

  const { data, error } = await client
    .from('vendor_fulfillment_settings')
    .upsert(payload as never, { onConflict: 'vendor_id' })
    .select(
      'vendor_id,enabled_method_codes,enabled_pickup_window_ids,enabled_delivery_window_ids,delivery_radius_km,pickup_address,default_method_code,preferences,created_at,updated_at',
    )
    .single()

  if (error) throw error
  return mapSettingsRow(data as VendorFulfillmentSettingsDbRow)
}

export function buildDefaultVendorFulfillmentSettings(
  vendorId: string,
  storeAddress: string | null,
): VendorFulfillmentSettings {
  const now = new Date().toISOString()
  return {
    vendorId,
    enabledMethodCodes: [],
    enabledPickupWindowIds: [],
    enabledDeliveryWindowIds: [],
    deliveryRadiusKm: null,
    pickupAddress: storeAddress,
    defaultMethodCode: null,
    preferences: normalizeVendorFulfillmentPreferences({ autoUseStoreAddressForPickup: true }),
    createdAt: now,
    updatedAt: now,
  }
}
