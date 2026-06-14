import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { buildVendorFulfillmentPreview } from '@/domains/logistics/application/projections/vendor-fulfillment-preview.projection'
import type { VendorFulfillmentConfigurationDto } from '@/domains/logistics/application/dto/vendor-fulfillment.dto'
import { listActiveFulfillmentMethods } from '@/domains/logistics/infrastructure/fulfillment-catalog.repository'
import {
  buildDefaultVendorFulfillmentSettings,
  findVendorFulfillmentSettingsByVendorId,
} from '@/domains/logistics/infrastructure/vendor-fulfillment.repository'
import {
  countActiveWindows,
  listVendorDeliveryWindows,
  listVendorPickupWindows,
} from '@/domains/logistics/infrastructure/vendor-time-windows.repository'

export async function getVendorFulfillmentConfiguration(
  vendorId: string,
): Promise<VendorFulfillmentConfigurationDto | null> {
  const supabase = await createClient()
  const store = await getStoreByUserId(vendorId)
  if (!store) return null

  const [methods, existingSettings, pickupWindows, deliveryWindows] = await Promise.all([
    listActiveFulfillmentMethods(supabase),
    findVendorFulfillmentSettingsByVendorId(supabase, vendorId),
    listVendorPickupWindows(supabase, vendorId),
    listVendorDeliveryWindows(supabase, vendorId),
  ])

  const settings =
    existingSettings ?? buildDefaultVendorFulfillmentSettings(vendorId, store.address ?? null)

  const preview = buildVendorFulfillmentPreview({
    storeName: store.name,
    storeAddress: store.address ?? null,
    settings,
    methods,
    pickupWindows,
    deliveryWindows,
  })

  return {
    settings,
    methods,
    pickupWindows,
    deliveryWindows,
    storeAddress: store.address ?? null,
    storeName: store.name,
    preview,
  }
}

export async function getVendorFulfillmentWindowCounts(vendorId: string) {
  const supabase = await createClient()
  const [pickupWindows, deliveryWindows] = await Promise.all([
    listVendorPickupWindows(supabase, vendorId),
    listVendorDeliveryWindows(supabase, vendorId),
  ])

  return {
    activePickupWindowCount: countActiveWindows(pickupWindows),
    activeDeliveryWindowCount: countActiveWindows(deliveryWindows),
  }
}
