import type { createClient } from '@/shared/database/supabase/server'
import type {
  FulfillmentMethodCode,
  FulfillmentMethodKind,
  FulfillmentMethodProvider,
  FulfillmentMethodRow,
} from '@/domains/logistics/domain/types'

type DbClient = Awaited<ReturnType<typeof createClient>>

type FulfillmentMethodDbRow = {
  code: FulfillmentMethodCode
  label: string
  kind: FulfillmentMethodKind
  provider: FulfillmentMethodProvider
  sort_order: number
  is_active: boolean
}

function mapMethodRow(row: FulfillmentMethodDbRow): FulfillmentMethodRow {
  return {
    code: row.code,
    label: row.label,
    kind: row.kind,
    provider: row.provider,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

export async function listActiveFulfillmentMethods(client: DbClient): Promise<FulfillmentMethodRow[]> {
  const { data, error } = await client
    .from('fulfillment_methods')
    .select('code,label,kind,provider,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) throw error
  return ((data ?? []) as FulfillmentMethodDbRow[]).map(mapMethodRow)
}
