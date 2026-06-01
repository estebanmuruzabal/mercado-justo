import { createClient } from '@/shared/database/supabase/server'
import { listUnitsByOwner } from '../../infrastructure/ditto-bot-inventory.repository'
import type { DittoBotInventoryUnitSummary } from '../../domain/ditto-bot-inventory-unit'

export async function listUserDittoBots(userId: string): Promise<DittoBotInventoryUnitSummary[]> {
  return listUnitsByOwner(userId)
}

export async function listCurrentUserDittoBots(): Promise<DittoBotInventoryUnitSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []
  return listUserDittoBots(user.id)
}
