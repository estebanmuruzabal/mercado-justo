'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/shared/database/supabase/server'
import { dispatchNotificationEvent } from '@/shared/events/legacy-notifications/events/dispatch'

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  storeId: z.string().min(1),
  title: z.string().min(1),
})

export async function createOrderFromCartAction(
  items: Array<z.infer<typeof cartItemSchema>>
): Promise<{ orderId: string }> {
  const parsed = z.array(cartItemSchema).safeParse(items)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid cart payload')

  const { supabase } = await createSellerBuyerContext()
  const userId = await getCurrentUserId(supabase)

  if (parsed.data.length === 0) throw new Error('Cart is empty.')

  const storeIds = new Set(parsed.data.map((i) => i.storeId))
  if (storeIds.size !== 1) {
    // For now we only support single-seller carts.
    throw new Error('El carrito debe pertenecer a un único vendedor.')
  }
  const sellerId = Array.from(storeIds)[0] as string

  // Prevent self-purchase (seller buying their own products).
  // `store.id` is a FK to `auth.users.id`, so comparing IDs is safe.
  if (sellerId === userId) {
    throw new Error('No podés comprar tus propios productos.')
  }

  const subtotal = parsed.data.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  // Create order.
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

  const typedOrderRow = orderRow as { id: string }
  const orderId = typedOrderRow.id

  // Fetch variant info for snapshots.
  const variantIds = parsed.data.map((i) => i.variantId)
  const { data: variantRows, error: variantError } = await supabase
    .from('listing_variant')
    .select('id, listing_id, sku, attributes_json')
    .in('id', variantIds)

  if (variantError) throw variantError

  const byVariantId = new Map(
    (variantRows ?? []).map((r: Record<string, unknown>) => [
      r.id as string,
      {
        listingId: r.listing_id as string,
        sku: r.sku as string,
        attributesJson: (r.attributes_json ?? {}) as Record<string, unknown>,
      },
    ])
  )

  const orderItemsPayload = parsed.data.map((i) => {
    const variantInfo = byVariantId.get(i.variantId)
    if (!variantInfo) {
      throw new Error(`Variante no encontrada: ${i.variantId}`)
    }

    return {
      order_id: orderId,
      listing_id: variantInfo.listingId,
      variant_id: i.variantId,
      quantity: i.quantity,
      title_snapshot: i.title,
      variant_snapshot: {
        sku: variantInfo.sku,
        attributes_json: variantInfo.attributesJson,
      },
      price_snapshot: i.unitPrice,
    } as never
  })

  const { error: itemsError } = await supabase.from('order_item').insert(orderItemsPayload as never[])
  if (itemsError) throw itemsError

  // Non-blocking: fan-out order notifications (Telegram + email, etc.).
  after(() => dispatchNotificationEvent({ type: 'order.created', payload: { orderId } }))

  return { orderId }
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

