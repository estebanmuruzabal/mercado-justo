import { createClient } from '@/shared/database/supabase/server'

export async function countDittoBotPublicStockByProductIds(
  productIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (productIds.length === 0) return result

  const supabase = await createClient()
  const { data, error } = await supabase.schema('public').rpc('ditto_bot_public_stock_by_product', {
    p_product_ids: productIds,
  })

  if (error) throw error

  for (const row of (data ?? []) as Array<{ product_id: string; stock_count: number }>) {
    result.set(row.product_id, Number(row.stock_count))
  }

  return result
}

export function isDittoBotPublicationAttributes(
  attributes: Record<string, unknown> | null | undefined,
): boolean {
  return attributes?.isDittoBot === true
}
