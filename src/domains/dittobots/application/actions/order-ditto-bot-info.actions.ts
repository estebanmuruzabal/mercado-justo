'use server'

import { listOrderDittoBotInfoForActor, type OrderDittoBotInfoView } from '../queries/order-ditto-bot-info.queries'
import type { OrderDittoBotInfoByOrderDto } from '../dto/order-ditto-bot-info.dto'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { createClient } from '@/shared/database/supabase/server'

export async function getOrderDittoBotInfoAction(input: {
  orderIds: string[]
  view: OrderDittoBotInfoView
}): Promise<OrderDittoBotInfoByOrderDto> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) return {}

  const role = await getUserRoleByUserId(user.id)

  return listOrderDittoBotInfoForActor({
    orderIds: input.orderIds,
    actorUserId: user.id,
    actorRole: role,
    view: input.view,
  })
}
