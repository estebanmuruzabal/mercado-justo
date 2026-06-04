'use server'

import { after } from 'next/server'
import { z } from 'zod'

import {
  assertResolvedCheckoutVariantsForOrder,
} from '@/domains/marketplace/orders/application/checkout-order-items'
import {
  aggregateCheckoutQuantitiesByListing,
  assertCheckoutListingStock,
  assertNoOwnListings,
  buildCheckoutRpcLines,
  groupCheckoutLinesByVendor,
  type CheckoutListingStockRow,
} from '@/domains/marketplace/orders/application/checkout-multivendor'
import { resolveCheckoutVariants } from '@/domains/marketplace/orders/application/checkout-variant.resolver'
import { inferTransactionKindFromPublicationTypes } from '@/domains/marketplace/transaction/domain/checkout-strategies'
import { fetchTransactionByLegacyOrderId } from '@/domains/marketplace/transaction/application/queries/transaction.queries'
import { createClient } from '@/shared/database/supabase/server'
import { dispatchNotificationEvent } from '@/shared/events/bus/dispatch'
import { createLogger, LogScopes } from '@/shared/lib/logger/logger'

const logCreateOrder = createLogger(LogScopes.checkout.createOrder)
const logResolveVariants = createLogger(LogScopes.checkout.resolveVariants)
const logStock = createLogger(LogScopes.checkout.stock)
const logOrders = createLogger(LogScopes.checkout.orders)

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  storeId: z.string().min(1),
  title: z.string().min(1),
})

export async function createOrderFromCartAction(
  items: Array<z.infer<typeof cartItemSchema>>,
): Promise<{ orderId: string; orderIds: string[] }> {
  logCreateOrder.debug('items received', { count: items.length, items })
  const parsed = z.array(cartItemSchema).safeParse(items)
  if (!parsed?.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid cart payload')

  const { supabase } = await createSellerBuyerContext()
  const userId = await getCurrentUserId(supabase)

  if (parsed.data.length === 0) throw new Error('Cart is empty.')

  // ADR-R6E-001: resolve cart ids → listing_variant.id before order_item insert.
  const variantIds = parsed.data.map((i) => i.variantId)
  const resolvedVariants = await resolveCheckoutVariants(supabase, variantIds)
  logResolveVariants.debug('variants resolved', {
    requested: variantIds.length,
    resolved: resolvedVariants.size,
  })

  const resolvedLines = parsed.data.map((item) => {
    const variantInfo = resolvedVariants.get(item.variantId)
    if (!variantInfo) {
      throw new Error(`Variante no encontrada: ${item.variantId}`)
    }
    return { item, variantInfo }
  })

  assertResolvedCheckoutVariantsForOrder(resolvedLines)

  const listingIds = [...new Set(resolvedLines.map((line) => line.variantInfo.listingId))]
  const { data: listingRows, error } = await supabase
    .from('listing')
    .select('id, store_id, stock, title')
    .in('id', listingIds)

  if (error) throw error

  const listingsById = new Map(((listingRows ?? []) as CheckoutListingStockRow[]).map((row) => [row.id, row]))

  const missingListingId = listingIds.find((id) => !listingsById.has(id))
  if (missingListingId) throw new Error(`Listing no encontrado: ${missingListingId}.`)

  assertNoOwnListings(userId, listingsById)

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

  const requestedByListing = aggregateCheckoutQuantitiesByListing(resolvedLines)

  for (const [listingId, quantity] of requestedByListing.entries()) {
    const listing = listingsById.get(listingId)
    const stockBefore = listing?.stock ?? 0
    logStock.debug('stock before debit', {
      listingId,
      title: listing?.title,
      stockBefore,
      quantity,
    })

    assertCheckoutListingStock(new Map([[listingId, quantity]]), listingsById)
  }

  const checkoutLines = buildCheckoutRpcLines(resolvedLines)

  const checkoutRpcClient = supabase as unknown as {
    rpc: (
      fn: 'create_orders_from_cart',
      args: { p_buyer_id: string; p_lines: unknown },
    ) => Promise<{ data: string[] | null; error: Error | null }>
  }
  const { data: createdOrderIds, error: createOrdersError } = await checkoutRpcClient.rpc(
    'create_orders_from_cart',
    {
      p_buyer_id: userId,
      p_lines: checkoutLines,
    },
  )

  if (createOrdersError) throw createOrdersError

  const orderIds = Array.isArray(createdOrderIds) ? createdOrderIds.map(String) : []
  if (orderIds.length === 0) throw new Error('No se pudo crear la orden.')

  const { data: stockAfterRows, error: stockAfterError } = await supabase
    .from('listing')
    .select('id, stock')
    .in('id', listingIds)
  if (stockAfterError) throw stockAfterError

  const stockAfterByListingId = new Map(
    ((stockAfterRows ?? []) as Array<{ id: string; stock: number | null }>).map((row) => [row.id, row.stock ?? 0]),
  )

  for (const [listingId, quantity] of requestedByListing.entries()) {
    logStock.debug('stock after debit', {
      listingId,
      quantity,
      stockAfter: stockAfterByListingId.get(listingId),
    })
  }

  logOrders.debug('orders created', { orderIds, count: orderIds.length })

  const { data: orderSellerRows, error: orderSellerError } = await supabase
    .from('order')
    .select('id, seller_id')
    .in('id', orderIds)
  if (orderSellerError) throw orderSellerError

  const orderSellers = ((orderSellerRows ?? []) as Array<{ id: string; seller_id: string }>).map((row) => ({
    orderId: row.id,
    sellerId: row.seller_id,
  }))

  after(async () => {
    const transactionKind = inferTransactionKindFromPublicationTypes(['product'])

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

  return { orderId: orderIds[0] as string, orderIds }
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
