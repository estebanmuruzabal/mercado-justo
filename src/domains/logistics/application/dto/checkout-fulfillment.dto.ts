import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import type {
  FulfillmentPreviewMethodDto,
  FulfillmentPreviewWindowDto,
  VendorFulfillmentPreviewDto,
} from '@/domains/logistics/application/dto/vendor-fulfillment.dto'

export type CheckoutVendorFulfillmentDto = {
  vendorId: string
  vendorName: string
  itemCount: number
  preview: VendorFulfillmentPreviewDto
  methods: FulfillmentPreviewMethodDto[]
  pickupWindows: FulfillmentPreviewWindowDto[]
  deliveryWindows: FulfillmentPreviewWindowDto[]
  defaultMethodCode: FulfillmentMethodCode | null
}

export type CheckoutVendorFulfillmentSelectionDto = {
  vendorId: string
  methodCode: FulfillmentMethodCode
  windowId: string
  scheduledDate: string
  startTime: string
  endTime: string
  pickupAddress: string | null
  deliveryAddress: string | null
}

export type CheckoutFulfillmentPayloadDto = {
  vendors: CheckoutVendorFulfillmentSelectionDto[]
}
