'use server'

import { after } from 'next/server'
import { z } from 'zod'

import {
  aggregateCheckoutQuantitiesByListing,
  DittoBotCheckoutStockError,
  validateDittoBotCheckoutStock,
} from '@/domains/dittobots/domain/ditto-bot-checkout-stock'
import { countDittoBotPublicStockByProductIds } from '@/domains/dittobots/application/queries/ditto-bot-public-stock.queries'
import {
  assertResolvedCheckoutVariantsForOrder,
  buildOrderItemsPayloadFromResolved,
} from '@/domains/marketplace/orders/application/checkout-order-items'
import { resolveCheckoutVariants } from '@/domains/marketplace/orders/application/checkout-variant.resolver'
import { inferTransactionKindFromPublicationTypes } from '@/domains/marketplace/transaction/domain/checkout-strategies'
import { fetchTransactionByLegacyOrderId } from '@/domains/marketplace/transaction/application/queries/transaction.queries'
import { createClient } from '@/shared/database/supabase/server'
import { dispatchNotificationEvent } from '@/shared/events/bus/dispatch'

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  storeId: z.string().min(1),
  title: z.string().min(1),
})

export async function createOrderFromCartAction(
  items: Array<z.infer<typeof cartItemSchema>>,
): Promise<{ orderId: string }> {
  const parsed = z.array(cartItemSchema).safeParse(items)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid cart payload')

  const { supabase } = await createSellerBuyerContext()
  const userId = await getCurrentUserId(supabase)

  if (parsed.data.length === 0) throw new Error('Cart is empty.')

  const storeIds = new Set(parsed.data.map((i) => i.storeId))
  if (storeIds.size !== 1) {
    throw new Error('El carrito debe pertenecer a un único vendedor.')
  }
  const sellerId = Array.from(storeIds)[0] as string

  if (sellerId === userId) {
    throw new Error('No podés comprar tus propios productos.')
  }

  // ADR-R6E-001: resolve cart ids → listing_variant.id before order_item insert.
  const variantIds = parsed.data.map((i) => i.variantId)
  const resolvedVariants = await resolveCheckoutVariants(supabase, variantIds)

  const resolvedLines = parsed.data.map((item) => {
    const variantInfo = resolvedVariants.get(item.variantId)
    if (!variantInfo) {
      throw new Error(`Variante no encontrada: ${item.variantId}`)
    }
    return { item, variantInfo }
  })

  assertResolvedCheckoutVariantsForOrder(resolvedLines)

  await validateDittoBotStockForCheckout(resolvedLines)

  const subtotal = parsed.data.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const { data: orderRow, error: orderError } = await supabase
    .from('order')
    .insert({
      buyer_id: userId,
      seller_id: sellerId,
      status: 'pending',
      payment_status: 'unpaid',
      subtotal,
      delivery_price: 0,
      total: subtotal,
    } as never)
    .select('id')
    .single()

  if (orderError || !orderRow) {
    throw orderError ?? new Error('No se pudo crear la orden.')
  }

  const orderId = (orderRow as { id: string }).id

  const orderItemsPayload = buildOrderItemsPayloadFromResolved(orderId, resolvedLines)

  const { error: itemsError } = await supabase.from('order_item').insert(orderItemsPayload as never[])
  if (itemsError) throw itemsError

  after(async () => {
    const transactionKind = inferTransactionKindFromPublicationTypes(['product'])
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
  })

  return { orderId }
}

async function validateDittoBotStockForCheckout(
  resolvedLines: Array<{
    item: z.infer<typeof cartItemSchema>
    variantInfo: { listingId: string }
  }>,
): Promise<void> {
  const listingIds = [...new Set(resolvedLines.map((line) => line.variantInfo.listingId))]
  const supabase = await createClient()

  const { data: listingRows, error } = await supabase
    .from('listing')
    .select('id, is_ditto_bot')
    .in('id', listingIds)

  if (error) throw error

  const dittoBotListingIds = new Set(
    ((listingRows ?? []) as Array<{ id: string; is_ditto_bot: boolean }>)
      .filter((row) => row.is_ditto_bot)
      .map((row) => row.id),
  )

  if (dittoBotListingIds.size === 0) return

  const quantitiesByListingId = aggregateCheckoutQuantitiesByListing(
    resolvedLines.map(({ item, variantInfo }) => ({
      listingId: variantInfo.listingId,
      quantity: item.quantity,
    })),
  )

  const stockByProductId = await countDittoBotPublicStockByProductIds([...dittoBotListingIds])

  try {
    validateDittoBotCheckoutStock({
      dittoBotListingIds,
      quantitiesByListingId,
      stockByProductId,
    })
  } catch (err) {
    if (err instanceof DittoBotCheckoutStockError) {
      throw new Error(err.message)
    }
    throw err
  }
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
