import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { buildVendorFulfillmentPreview } from '@/domains/logistics/application/projections/vendor-fulfillment-preview.projection'
import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { listActiveFulfillmentMethods } from '@/domains/logistics/infrastructure/fulfillment-catalog.repository'
import {
  buildDefaultVendorFulfillmentSettings,
  findVendorFulfillmentSettingsByVendorId,
} from '@/domains/logistics/infrastructure/vendor-fulfillment.repository'
import {
  listVendorDeliveryWindows,
  listVendorPickupWindows,
} from '@/domains/logistics/infrastructure/vendor-time-windows.repository'
import {
  formatTimeLabel,
  ISO_WEEKDAY_LABELS,
  isIsoWeekday,
} from '@/domains/logistics/domain/window-schedule'
import type { DeliveryWindowRow, PickupWindowRow } from '@/domains/logistics/domain/types'

function mapPreviewWindow(
  window: PickupWindowRow | DeliveryWindowRow,
  kind: 'pickup' | 'delivery',
) {
  if (!window.isActive || window.dayOfWeek == null || !isIsoWeekday(window.dayOfWeek)) {
    return null
  }

  return {
    id: window.id,
    label: window.label,
    dayLabel: ISO_WEEKDAY_LABELS[window.dayOfWeek],
    timeRange: `${formatTimeLabel(window.startTime)} — ${formatTimeLabel(window.endTime)}`,
    kind,
  }
}

async function loadVendorCheckoutFulfillment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vendorId: string,
  itemCount: number,
): Promise<CheckoutVendorFulfillmentDto | null> {
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

  const enabledMethods = preview.methods

  return {
    vendorId,
    vendorName: store.name,
    itemCount,
    preview,
    methods: enabledMethods,
    pickupWindows: pickupWindows
      .map((window) => mapPreviewWindow(window, 'pickup'))
      .filter((window): window is NonNullable<typeof window> => window != null),
    deliveryWindows: deliveryWindows
      .map((window) => mapPreviewWindow(window, 'delivery'))
      .filter((window): window is NonNullable<typeof window> => window != null),
    defaultMethodCode: settings.defaultMethodCode,
  }
}

export async function getCheckoutFulfillmentOptionsForVendors(input: {
  vendorIds: string[]
  itemCountsByVendor?: Record<string, number>
}): Promise<CheckoutVendorFulfillmentDto[]> {
  const uniqueVendorIds = [...new Set(input.vendorIds.filter(Boolean))]
  if (uniqueVendorIds.length === 0) return []

  const supabase = await createClient()
  const results = await Promise.all(
    uniqueVendorIds.map((vendorId) =>
      loadVendorCheckoutFulfillment(
        supabase,
        vendorId,
        input.itemCountsByVendor?.[vendorId] ?? 0,
      ),
    ),
  )

  return results.filter((result): result is CheckoutVendorFulfillmentDto => result != null)
}
