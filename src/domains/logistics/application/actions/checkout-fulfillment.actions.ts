'use server'

import type { CheckoutVendorFulfillmentDto } from '@/domains/logistics/application/dto/checkout-fulfillment.dto'
import { getCheckoutFulfillmentOptionsForVendors } from '@/domains/logistics/application/queries/checkout-fulfillment.queries'

export async function getCheckoutFulfillmentOptionsAction(input: {
  vendorIds: string[]
  itemCountsByVendor?: Record<string, number>
}): Promise<CheckoutVendorFulfillmentDto[]> {
  return getCheckoutFulfillmentOptionsForVendors(input)
}
