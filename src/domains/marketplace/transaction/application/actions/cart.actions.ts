'use server'

/**
 * ADR-R6E-001: cart_line.variant_id FK → listing_variant.id.
 * line_kind 'offer_variant' is a historical label; do not persist offer_variant.id.
 */
import { createClient } from '@/shared/database/supabase/server'

export type CartLineDto = {
  id: string
  variantId: string | null
  publicationId: string | null
  quantity: number
  unitPrice: number
  titleSnapshot: string
  variantName?: string | null
  variantAttributes?: Record<string, string> | null
}

export async function getServerCartLines(): Promise<CartLineDto[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: cart } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cart) return []

  const { data: lines, error } = await supabase
    .from('cart_line')
    .select('id, variant_id, publication_id, quantity, unit_price, title_snapshot, metadata_json')
    .eq('cart_id', (cart as { id: string }).id)

  if (error) return []

  return (lines ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    variantId: row.variant_id as string | null,
    publicationId: row.publication_id as string | null,
    quantity: row.quantity as number,
    unitPrice: Number(row.unit_price),
    titleSnapshot: row.title_snapshot as string,
    variantName: (() => {
      const metadata = row.metadata_json as Record<string, unknown> | null
      return typeof metadata?.variantName === 'string' ? metadata.variantName : null
    })(),
    variantAttributes: (() => {
      const metadata = row.metadata_json as Record<string, unknown> | null
      const rawAttributes = metadata?.variantAttributes
      if (!rawAttributes || typeof rawAttributes !== 'object') return null
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(rawAttributes as Record<string, unknown>)) {
        if (typeof value === 'string') {
          normalized[key] = value
        }
      }
      return Object.keys(normalized).length > 0 ? normalized : null
    })(),
  }))
}

export async function upsertServerCartLine(input: {
  variantId: string
  publicationId?: string
  quantity: number
  unitPrice: number
  titleSnapshot: string
  variantName?: string
  variantAttributes?: Record<string, string>
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  let cartId: string
  const { data: existingCart } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingCart) {
    cartId = (existingCart as { id: string }).id
  } else {
    const { data: newCart, error } = await supabase
      .from('cart')
      .insert({ user_id: user.id } as never)
      .select('id')
      .single()
    if (error || !newCart) throw error ?? new Error('Could not create cart')
    cartId = (newCart as { id: string }).id
  }

  const { error: lineError } = await supabase.from('cart_line').upsert(
    {
      cart_id: cartId,
      line_kind: 'offer_variant',
      variant_id: input.variantId,
      publication_id: input.publicationId ?? null,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      title_snapshot: input.titleSnapshot,
      metadata_json: {
        variantName: input.variantName ?? null,
        variantAttributes: input.variantAttributes ?? null,
      },
    } as never,
    { onConflict: 'cart_id,variant_id' },
  )

  if (lineError) throw lineError

  await supabase.from('cart').update({ updated_at: new Date().toISOString() } as never).eq('id', cartId)
}

export async function removeServerCartLine(variantId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: cart } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cart) return
  await supabase
    .from('cart_line')
    .delete()
    .eq('cart_id', (cart as { id: string }).id)
    .eq('variant_id', variantId)
}

export async function clearServerCart(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: cart } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cart) return
  await supabase.from('cart_line').delete().eq('cart_id', (cart as { id: string }).id)
}
