import type {
  DeliveryWindowRow,
  FulfillmentMethodRow,
  PickupWindowRow,
  VendorFulfillmentSettings,
} from '@/domains/logistics/domain/types'

export type FulfillmentPreviewMethodDto = {
  code: FulfillmentMethodRow['code']
  label: string
  kind: FulfillmentMethodRow['kind']
  provider: FulfillmentMethodRow['provider']
  isDefault: boolean
}

export type FulfillmentPreviewWindowDto = {
  id: string
  label: string
  dayLabel: string
  timeRange: string
  kind: 'pickup' | 'delivery'
}

export type FulfillmentPreviewPreferencesDto = {
  autoUseStoreAddressForPickup: boolean
  requireBuyerConfirmation: boolean
  allowSameDayPickup: boolean
  allowSameDayDelivery: boolean
  minimumPreparationMinutes: number | null
  pickupAddress: string | null
  deliveryRadiusKm: number | null
  notes: string | null
}

export type VendorFulfillmentPreviewDto = {
  vendorName: string
  methods: FulfillmentPreviewMethodDto[]
  pickupWindows: FulfillmentPreviewWindowDto[]
  deliveryWindows: FulfillmentPreviewWindowDto[]
  preferences: FulfillmentPreviewPreferencesDto
  isReadyForCheckout: boolean
  readinessIssues: string[]
}

export type VendorFulfillmentWindowInputDto = {
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone?: string
  isActive?: boolean
}

export type VendorTimeWindowMutationResultDto =
  | { success: true; windowId: string }
  | { success: false; error: string }

export type VendorFulfillmentConfigurationDto = {
  settings: VendorFulfillmentSettings
  methods: FulfillmentMethodRow[]
  pickupWindows: PickupWindowRow[]
  deliveryWindows: DeliveryWindowRow[]
  storeAddress: string | null
  storeName: string
  preview: VendorFulfillmentPreviewDto
}

export type SaveVendorFulfillmentSettingsInputDto = {
  enabledMethodCodes: VendorFulfillmentSettings['enabledMethodCodes']
  deliveryRadiusKm: number | null
  pickupAddress: string | null
  defaultMethodCode: VendorFulfillmentSettings['defaultMethodCode']
  preferences: VendorFulfillmentSettings['preferences']
}

export type SaveVendorFulfillmentSettingsResultDto =
  | { success: true }
  | { success: false; error: string }
