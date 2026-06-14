import type {
  FulfillmentMethodCode,
  VendorFulfillmentPreferences,
  VendorFulfillmentSettings,
} from '@/domains/logistics/domain/types'

export type VendorFulfillmentValidationInput = Pick<
  VendorFulfillmentSettings,
  'enabledMethodCodes' | 'deliveryRadiusKm' | 'defaultMethodCode' | 'preferences' | 'pickupAddress'
>

export type VendorFulfillmentValidationContext = {
  availableMethodCodes: readonly FulfillmentMethodCode[]
  activePickupWindowCount: number
  activeDeliveryWindowCount: number
  storeAddress: string | null
}

export function normalizeVendorFulfillmentPreferences(
  value: unknown,
): VendorFulfillmentPreferences {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  const minimumPreparationMinutes =
    typeof record.minimumPreparationMinutes === 'number' &&
    Number.isFinite(record.minimumPreparationMinutes) &&
    record.minimumPreparationMinutes >= 0
      ? Math.round(record.minimumPreparationMinutes)
      : null

  return {
    autoUseStoreAddressForPickup:
      typeof record.autoUseStoreAddressForPickup === 'boolean'
        ? record.autoUseStoreAddressForPickup
        : true,
    requireBuyerConfirmation:
      typeof record.requireBuyerConfirmation === 'boolean'
        ? record.requireBuyerConfirmation
        : false,
    allowSameDayPickup:
      typeof record.allowSameDayPickup === 'boolean' ? record.allowSameDayPickup : false,
    allowSameDayDelivery:
      typeof record.allowSameDayDelivery === 'boolean' ? record.allowSameDayDelivery : false,
    minimumPreparationMinutes,
    notes:
      typeof record.notes === 'string' && record.notes.trim().length > 0
        ? record.notes.trim()
        : null,
  }
}

export function validateVendorFulfillmentSettings(
  input: VendorFulfillmentValidationInput,
  context: VendorFulfillmentValidationContext,
): string | null {
  const methodSet = new Set(context.availableMethodCodes)

  for (const code of input.enabledMethodCodes) {
    if (!methodSet.has(code)) {
      return `El método "${code}" no está disponible.`
    }
  }

  if (input.defaultMethodCode && !input.enabledMethodCodes.includes(input.defaultMethodCode)) {
    return 'El método preferido debe estar entre los métodos habilitados.'
  }

  const hasSellerDelivery = input.enabledMethodCodes.includes('delivery_seller')
  if (hasSellerDelivery && input.deliveryRadiusKm == null) {
    return 'Indicá un radio de delivery cuando ofrecés entrega propia.'
  }

  if (input.deliveryRadiusKm != null && input.deliveryRadiusKm < 0) {
    return 'El radio de delivery no puede ser negativo.'
  }

  const hasPickup =
    input.enabledMethodCodes.includes('pickup_seller') ||
    input.enabledMethodCodes.includes('pickup_dittovan')
  if (hasPickup && context.activePickupWindowCount === 0) {
    return 'Creá al menos una ventana activa de pickup.'
  }

  const hasDelivery =
    input.enabledMethodCodes.includes('delivery_seller') ||
    input.enabledMethodCodes.includes('delivery_dittovan')
  if (hasDelivery && context.activeDeliveryWindowCount === 0) {
    return 'Creá al menos una ventana activa de delivery.'
  }

  if (hasPickup) {
    const pickupAddress = input.preferences.autoUseStoreAddressForPickup
      ? context.storeAddress
      : input.pickupAddress
    if (!pickupAddress?.trim()) {
      return 'Definí una dirección de pickup o activá el uso de la dirección de la tienda.'
    }
  }

  if (
    input.preferences.minimumPreparationMinutes != null &&
    input.preferences.minimumPreparationMinutes < 0
  ) {
    return 'El tiempo mínimo de preparación no puede ser negativo.'
  }

  return null
}
