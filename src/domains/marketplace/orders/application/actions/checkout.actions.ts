'use server'

import { after } from 'next/server'
import { z } from 'zod'

import {
  assertResolvedCheckoutVariantsForOrder,
} from '@/domains/marketplace/orders/application/checkout-order-items'
import {
  aggregateCheckoutQuantitiesByListing,
  aggregateCheckoutQuantitiesByVariant,
  assertCheckoutVariantStock,
  assertNoOwnListings,
  buildCheckoutRpcLines,
  groupCheckoutLinesByVendor,
  type CheckoutListingStockRow,
  type CheckoutVariantStockRow,
} from '@/domains/marketplace/orders/application/checkout-multivendor'
import {
  resolveCheckoutVariants,
  type ResolvedCheckoutVariant,
} from '@/domains/marketplace/orders/application/checkout-variant.resolver'
import { inferTransactionKindFromPublicationTypes } from '@/domains/marketplace/transaction/domain/checkout-strategies'
import { fetchTransactionByLegacyOrderId } from '@/domains/marketplace/transaction/application/queries/transaction.queries'
import { FULFILLMENT_METHOD_CODES } from '@/domains/logistics/domain/types'
import {
  normalizeCheckoutSelectionTimes,
  validateCheckoutFulfillmentPayload,
} from '@/domains/logistics/domain/policies/checkout-fulfillment-policy'
import { getCheckoutFulfillmentOptionsForVendors } from '@/domains/logistics/application/queries/checkout-fulfillment.queries'
import { createClient } from '@/shared/database/supabase/server'
import { dispatchNotificationEvent } from '@/shared/events/bus/dispatch'
import { createLogger, LogScopes } from '@/shared/lib/logger/logger'

const logCreateOrder = createLogger(LogScopes.checkout.createOrder)
const logResolveVariants = createLogger(LogScopes.checkout.resolveVariants)
const logStock = createLogger(LogScopes.checkout.stock)
const logOrders = createLogger(LogScopes.checkout.orders)

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  variantName: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  storeId: z.string().min(1),
  title: z.string().min(1),
})

const fulfillmentSelectionSchema = z.object({
  vendorId: z.string().uuid(),
  methodCode: z.enum(FULFILLMENT_METHOD_CODES),
  windowId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  pickupAddress: z.string().nullable().default(null),
  deliveryAddress: z.string().nullable().default(null),
})

const checkoutPayloadSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  fulfillments: z.array(fulfillmentSelectionSchema).min(1),
})

type ParsedCartItem = z.infer<typeof cartItemSchema>

type CheckoutContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

type CheckoutData = {
  userId: string
  resolvedLines: Array<{
    item: ParsedCartItem
    variantInfo: ResolvedCheckoutVariant
  }>
  listingIds: string[]
  variantIds: string[]
  listingsById: Map<string, CheckoutListingStockRow>
  variantsById: Map<string, CheckoutVariantStockRow>
  requestedByListing: Map<string, number>
  requestedByVariant: Map<string, number>
  checkoutLines: ReturnType<typeof buildCheckoutRpcLines>
}

export async function createOrderFromCartAction(
  input: z.input<typeof checkoutPayloadSchema>,
): Promise<{ orderId: string; orderIds: string[] }> {
  const parsed = checkoutPayloadSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid checkout payload')
  }

  const parsedItems = parsed.data.items
  const context = await createCheckoutContext()
  const checkoutData = await resolveCheckoutData(context.supabase, context.userId, parsedItems)

  validateCheckout(checkoutData)

  const vendorIds = [...new Set(parsedItems.map((item) => item.storeId))]
  const vendorOptions = await getCheckoutFulfillmentOptionsForVendors({
    vendorIds,
    itemCountsByVendor: Object.fromEntries(
      vendorIds.map((vendorId) => [
        vendorId,
        parsedItems
          .filter((item) => item.storeId === vendorId)
          .reduce((sum, item) => sum + item.quantity, 0),
      ]),
    ),
  })

  const normalizedFulfillments = parsed.data.fulfillments.map((selection) =>
    normalizeCheckoutSelectionTimes(selection),
  )

  const selections = Object.fromEntries(
    normalizedFulfillments.map((selection) => [selection.vendorId, selection]),
  )

  const fulfillmentErrors = validateCheckoutFulfillmentPayload({
    vendors: vendorOptions,
    selections,
    deliveryAddress:
      normalizedFulfillments.find((selection) => selection.deliveryAddress)?.deliveryAddress ?? null,
  })

  if (fulfillmentErrors.length > 0) {
    throw new Error(fulfillmentErrors[0])
  }

  const orderIds = await createOrders(
    context.supabase,
    context.userId,
    checkoutData,
    normalizedFulfillments,
  )

  await logStockChanges(context.supabase, checkoutData)

  scheduleNotifications(context.userId, orderIds)

  return {
    orderId: orderIds[0] as string,
    orderIds,
  }
}


async function createCheckoutContext(): Promise<CheckoutContext> {
  const { supabase } = await createSellerBuyerContext()
  const userId = await getCurrentUserId(supabase)
  return { supabase, userId }
}

async function resolveCheckoutData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  parsedItems: ParsedCartItem[],
): Promise<CheckoutData> {
  // ADR-R6E-001: resolve cart ids → listing_variant.id before order_item insert.
  const variantIds = parsedItems.map((item) => item.variantId)
  const resolvedVariants = await resolveCheckoutVariants(supabase, variantIds)
  logResolveVariants.debug('variants resolved', {
    requested: variantIds.length,
    resolved: resolvedVariants.size,
  })

  const resolvedLines = parsedItems.map((item) => {
    const variantInfo = resolvedVariants.get(item.variantId)
    if (!variantInfo) {
      throw new Error(`Variante no encontrada: ${item.variantId}`)
    }
    return { item, variantInfo }
  })

  const listingIds = [...new Set(resolvedLines.map((line) => line.variantInfo.listingId))]
  const variantIdsForStock = [...new Set(resolvedLines.map((line) => line.variantInfo.listingVariantId))]
  const { data: listingRows, error } = await supabase
    .from('listing')
    .select('id, store_id, stock, title')
    .in('id', listingIds)

  if (error) throw error

  const listingsById = new Map(((listingRows ?? []) as CheckoutListingStockRow[]).map((row) => [row.id, row]))
  const { data: variantRows, error: variantError } = await supabase
    .from('listing_variant')
    .select('id, listing_id, stock')
    .in('id', variantIdsForStock)

  if (variantError) throw variantError

  const variantsById = new Map(
    ((variantRows ?? []) as CheckoutVariantStockRow[]).map((row) => [row.id, row]),
  )

  const missingListingId = listingIds.find((id) => !listingsById.has(id))
  if (missingListingId) throw new Error(`Listing no encontrado: ${missingListingId}.`)
  const missingVariantId = variantIdsForStock.find((id) => !variantsById.has(id))
  if (missingVariantId) throw new Error(`Variante no encontrada: ${missingVariantId}.`)

  const groups = groupCheckoutLinesByVendor(resolvedLines, listingsById)
  logResolveVariants.debug('resolved checkout lines', {
    lines: resolvedLines.map((line) => {
      const listing = listingsById.get(line.variantInfo.listingId)
      return {
        cartVariantId: line.item.variantId,
        listingVariantId: line.variantInfo.listingVariantId,
        listingId: line.variantInfo.listingId,
        sellerId: listing?.store_id,
        payloadStoreId: line.item.storeId,
      }
    }),
  })

  logCreateOrder.debug('vendor groups', {
    groups: [...groups.entries()].map(([sellerId, lines]) => ({ sellerId, lineCount: lines.length })),
  })

  return {
    userId,
    resolvedLines,
    listingIds,
    variantIds: variantIdsForStock,
    listingsById,
    variantsById,
    requestedByListing: aggregateCheckoutQuantitiesByListing(resolvedLines),
    requestedByVariant: aggregateCheckoutQuantitiesByVariant(resolvedLines),
    checkoutLines: buildCheckoutRpcLines(resolvedLines),
  }
}

function validateCheckout(checkoutData: CheckoutData): void {
  assertResolvedCheckoutVariantsForOrder(checkoutData.resolvedLines)
  assertNoOwnListings(checkoutData.userId, checkoutData.listingsById)
  assertCheckoutVariantStock(checkoutData.requestedByVariant, checkoutData.variantsById)

  for (const listingId of checkoutData.listingIds) {
    if (!checkoutData.listingsById.has(listingId)) {
      throw new Error(`Listing no encontrado: ${listingId}.`)
    }
  }

  for (const variantId of checkoutData.variantIds) {
    if (!checkoutData.variantsById.has(variantId)) {
      throw new Error(`Variante no encontrada: ${variantId}.`)
    }
  }
}

async function createOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  checkoutData: CheckoutData,
  fulfillments: Array<z.infer<typeof fulfillmentSelectionSchema>>,
): Promise<string[]> {
  const checkoutRpcClient = supabase as unknown as {
    rpc: (
      fn: 'create_orders_from_cart',
      args: { p_buyer_id: string; p_lines: unknown; p_fulfillments: unknown },
    ) => Promise<{ data: string[] | null; error: Error | null }>
  }

  const rpcFulfillments = fulfillments.map((selection) => ({
    vendor_id: selection.vendorId,
    method_code: selection.methodCode,
    window_id: selection.windowId,
    scheduled_date: selection.scheduledDate,
    start_time: selection.startTime.length === 5 ? `${selection.startTime}:00` : selection.startTime,
    end_time: selection.endTime.length === 5 ? `${selection.endTime}:00` : selection.endTime,
    pickup_address: selection.pickupAddress ?? null,
    delivery_address: selection.deliveryAddress ?? null,
  }))

  const { data: createdOrderIds, error: createOrdersError } = await checkoutRpcClient.rpc(
    'create_orders_from_cart',
    {
      p_buyer_id: userId,
      p_lines: checkoutData.checkoutLines,
      p_fulfillments: rpcFulfillments,
    },
  )

  if (createOrdersError) throw createOrdersError

  const orderIds = Array.isArray(createdOrderIds) ? createdOrderIds.map(String) : []
  if (orderIds.length === 0) throw new Error('No se pudo crear la orden.')

  logOrders.debug('orders created', { orderIds, count: orderIds.length })

  return orderIds
}

async function logStockChanges(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checkoutData: CheckoutData,
): Promise<void> {
  for (const [listingId, quantity] of checkoutData.requestedByListing.entries()) {
    const listing = checkoutData.listingsById.get(listingId)
    const stockBefore = listing?.stock ?? 0
    logStock.debug('stock before debit', {
      listingId,
      title: listing?.title,
      stockBefore,
      quantity,
    })
  }

  const { data: stockAfterRows, error: stockAfterError } = await supabase
    .from('listing_variant')
    .select('id, stock')
    .in('id', checkoutData.variantIds)
  if (stockAfterError) throw stockAfterError

  const stockAfterByVariantId = new Map(
    ((stockAfterRows ?? []) as Array<{ id: string; stock: number | null }>).map((row) => [row.id, row.stock ?? 0]),
  )

  for (const [variantId, quantity] of checkoutData.requestedByVariant.entries()) {
    logStock.debug('stock after debit', {
      variantId,
      quantity,
      stockAfter: stockAfterByVariantId.get(variantId),
    })
  }
}

function scheduleNotifications(userId: string, orderIds: string[]): void {
  after(async () => {
    const transactionKind = inferTransactionKindFromPublicationTypes(['product'])

    const { supabase } = await createSellerBuyerContext()

    const { data: orderSellerRows, error: orderSellerError } = await supabase
      .from('order')
      .select('id, seller_id')
      .in('id', orderIds)
    if (orderSellerError) throw orderSellerError

    const orderSellers = ((orderSellerRows ?? []) as Array<{ id: string; seller_id: string }>).map((row) => ({
      orderId: row.id,
      sellerId: row.seller_id,
    }))

    await Promise.all(
      orderSellers.map(async ({ orderId, sellerId }) => {
        const transaction = await fetchTransactionByLegacyOrderId(orderId)

        await dispatchNotificationEvent({ type: 'order.created', payload: { orderId } })
        await dispatchNotificationEvent({
          type: 'marketplace.transaction.confirmed',
          payload: {
            transactionId: transaction?.id ?? orderId,
            kind: transaction?.kind ?? transactionKind,
            buyerId: userId,
            sellerId,
          },
        })
      }),
    )
  })
}

async function getCurrentUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Unauthorized')
  return data.user.id
}

async function createSellerBuyerContext() {
  const supabase = await createClient()
  return { supabase }
}
