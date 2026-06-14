import {
  buildVendorWindowLabel,
  formatTimeLabel,
  isIsoWeekday,
  ISO_WEEKDAY_LABELS,
  type IsoWeekday,
} from '@/domains/logistics/domain/window-schedule'
import type {
  FulfillmentMethodRow,
  PickupWindowRow,
  DeliveryWindowRow,
  VendorFulfillmentSettings,
} from '@/domains/logistics/domain/types'
import type { VendorFulfillmentPreviewDto } from '@/domains/logistics/application/dto/vendor-fulfillment.dto'

function mapPreviewWindow(
  window: PickupWindowRow | DeliveryWindowRow,
  kind: 'pickup' | 'delivery',
): VendorFulfillmentPreviewDto['pickupWindows'][number] | null {
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

export function buildVendorFulfillmentPreview(input: {
  storeName: string
  storeAddress: string | null
  settings: VendorFulfillmentSettings
  methods: FulfillmentMethodRow[]
  pickupWindows: PickupWindowRow[]
  deliveryWindows: DeliveryWindowRow[]
}): VendorFulfillmentPreviewDto {
  const enabledMethods = input.methods.filter((method) =>
    input.settings.enabledMethodCodes.includes(method.code),
  )

  const activePickupWindows = input.pickupWindows
    .map((window) => mapPreviewWindow(window, 'pickup'))
    .filter((window): window is NonNullable<typeof window> => window != null)

  const activeDeliveryWindows = input.deliveryWindows
    .map((window) => mapPreviewWindow(window, 'delivery'))
    .filter((window): window is NonNullable<typeof window> => window != null)

  const readinessIssues: string[] = []
  const hasPickup = enabledMethods.some((method) => method.kind === 'pickup')
  const hasDelivery = enabledMethods.some((method) => method.kind === 'delivery')
  const hasSellerDelivery = input.settings.enabledMethodCodes.includes('delivery_seller')

  if (enabledMethods.length === 0) {
    readinessIssues.push('No hay métodos de fulfillment habilitados.')
  }

  if (hasPickup && activePickupWindows.length === 0) {
    readinessIssues.push('Faltan ventanas activas de pickup.')
  }

  if (hasDelivery && activeDeliveryWindows.length === 0) {
    readinessIssues.push('Faltan ventanas activas de delivery.')
  }

  if (hasSellerDelivery && input.settings.deliveryRadiusKm == null) {
    readinessIssues.push('Falta definir el radio de delivery propio.')
  }

  if (hasPickup) {
    const pickupAddress = input.settings.preferences.autoUseStoreAddressForPickup
      ? input.storeAddress
      : input.settings.pickupAddress
    if (!pickupAddress?.trim()) {
      readinessIssues.push('Falta una dirección de pickup.')
    }
  }

  return {
    vendorName: input.storeName,
    methods: enabledMethods.map((method) => ({
      code: method.code,
      label: method.label,
      kind: method.kind,
      provider: method.provider,
      isDefault: input.settings.defaultMethodCode === method.code,
    })),
    pickupWindows: activePickupWindows,
    deliveryWindows: activeDeliveryWindows,
    preferences: {
      autoUseStoreAddressForPickup: input.settings.preferences.autoUseStoreAddressForPickup,
      requireBuyerConfirmation: input.settings.preferences.requireBuyerConfirmation,
      allowSameDayPickup: input.settings.preferences.allowSameDayPickup,
      allowSameDayDelivery: input.settings.preferences.allowSameDayDelivery,
      minimumPreparationMinutes: input.settings.preferences.minimumPreparationMinutes,
      pickupAddress: input.settings.preferences.autoUseStoreAddressForPickup
        ? input.storeAddress
        : input.settings.pickupAddress,
      deliveryRadiusKm: input.settings.deliveryRadiusKm,
      notes: input.settings.preferences.notes,
    },
    isReadyForCheckout: readinessIssues.length === 0,
    readinessIssues,
  }
}

export function buildWindowLabelFromInput(dayOfWeek: IsoWeekday, startTime: string, endTime: string) {
  return buildVendorWindowLabel(dayOfWeek, startTime, endTime)
}
