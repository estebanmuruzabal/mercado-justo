import { createClient } from '@/shared/database/supabase/server'

export type TransactionSummaryDto = {
  id: string
  kind: string
  status: string
  paymentStatus: string
  buyerId: string
  sellerId: string
  subtotal: number
  total: number
  legacyOrderId: string | null
  createdAt: string
}

export async function fetchUserTransactions(userId: string): Promise<TransactionSummaryDto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketplace_transaction')
    .select(
      'id, kind, status, payment_status, buyer_id, seller_id, subtotal, total, legacy_order_id, created_at',
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    kind: row.kind as string,
    status: row.status as string,
    paymentStatus: row.payment_status as string,
    buyerId: row.buyer_id as string,
    sellerId: row.seller_id as string,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    legacyOrderId: row.legacy_order_id as string | null,
    createdAt: row.created_at as string,
  }))
}

export async function fetchTransactionByLegacyOrderId(
  orderId: string,
): Promise<TransactionSummaryDto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketplace_transaction')
    .select(
      'id, kind, status, payment_status, buyer_id, seller_id, subtotal, total, legacy_order_id, created_at',
    )
    .eq('legacy_order_id', orderId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as Record<string, unknown>
  return {
    id: row.id as string,
    kind: row.kind as string,
    status: row.status as string,
    paymentStatus: row.payment_status as string,
    buyerId: row.buyer_id as string,
    sellerId: row.seller_id as string,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    legacyOrderId: row.legacy_order_id as string | null,
    createdAt: row.created_at as string,
  }
}
