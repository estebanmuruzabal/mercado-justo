import { createClient } from '@/shared/database/supabase/server'
import { createLogger } from '@/shared/lib/logger/logger'

const logDittoBotStock = createLogger('dittobots.stock')

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
  logDittoBotStock.debug('public stock by product resolved', {
    productCount: productIds.length,
    rowCount: (data ?? []).length,
  })
  for (const row of (data ?? []) as Array<{ product_id: string; stock_count: number }>) {
    result.set(row.product_id, Number(row.stock_count))
  }

  return result
}

