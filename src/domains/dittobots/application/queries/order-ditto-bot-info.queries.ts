import { isSuperAdmin, type Role } from '@/domains/users/domain/roles'
import { createServiceClient } from '@/shared/database/supabase/service'

import type {
  OrderDittoBotInfoByOrderDto,
  OrderDittoBotInfoDto,
} from '../dto/order-ditto-bot-info.dto'
import {
  canViewFullActivationCode,
  maskActivationCode,
  type PurchasedDittoBotViewerKind,
} from '../../domain/purchased-ditto-bot-visibility'

export type OrderDittoBotInfoView = 'purchase' | 'sale'

type OrderAccessRow = {
  id: string
  buyer_id: string
  seller_id: string
}

type OrderItemTitleRow = {
  id: string
  order_id: string
  title_snapshot: string | null
}

type InventoryUnitRow = {
  id: string
  order_id: string | null
  order_item_id: string | null
  product_id: string | null
  serial_number: string
  activation_code: string
  status: string
  firmware_version: string | null
  activated_at: string | null
  publication?: { title: string | null } | { title: string | null }[] | null
}

export async function listOrderDittoBotInfoForActor(input: {
  orderIds: string[]
  actorUserId: string
  actorRole: Role | null
  view: OrderDittoBotInfoView
}): Promise<OrderDittoBotInfoByOrderDto> {
  const orderIds = [...new Set(input.orderIds.filter(Boolean))]
  if (orderIds.length === 0) return {}

  const service = createServiceClient()
  const isActorSuperAdmin = isSuperAdmin(input.actorRole)

  const { data: orderRows, error: orderError } = await service
    .from('order')
    .select('id,buyer_id,seller_id')
    .in('id', orderIds)

  if (orderError) throw orderError

  const accessibleOrders = ((orderRows ?? []) as OrderAccessRow[]).filter((order) => {
    if (isActorSuperAdmin) return true
    if (input.view === 'purchase') return order.buyer_id === input.actorUserId
    return order.seller_id === input.actorUserId
  })

  const accessibleOrderIds = accessibleOrders.map((order) => order.id)
  if (accessibleOrderIds.length === 0) return {}

  const viewerKind: PurchasedDittoBotViewerKind = isActorSuperAdmin
    ? 'super-admin'
    : input.view === 'purchase'
      ? 'buyer'
      : 'vendor'

  const [unitsResult, itemsResult] = await Promise.all([
    service
      .from('ditto_bot_inventory_unit')
      .select(
        'id,order_id,order_item_id,product_id,serial_number,activation_code,status,firmware_version,activated_at,publication:product_id(title)',
      )
      .in('order_id', accessibleOrderIds),
    service
      .from('order_item')
      .select('id,order_id,title_snapshot')
      .in('order_id', accessibleOrderIds),
  ])

  if (unitsResult.error) throw unitsResult.error
  if (itemsResult.error) throw itemsResult.error

  const itemTitleById = new Map(
    ((itemsResult.data ?? []) as OrderItemTitleRow[]).map((item) => [
      item.id,
      item.title_snapshot ?? 'DittoBot',
    ]),
  )

  const rows = (unitsResult.data ?? []) as InventoryUnitRow[]
  const result: OrderDittoBotInfoByOrderDto = {}

  for (const row of rows) {
    if (!row.order_id) continue
    const productName = getPublicationTitle(row.publication) ?? getItemTitle(row.order_item_id, itemTitleById)
    const canCopyActivationCode = canViewFullActivationCode(viewerKind)
    const dto: OrderDittoBotInfoDto = {
      id: row.id,
      orderId: row.order_id,
      orderItemId: row.order_item_id,
      productId: row.product_id,
      productName,
      serialNumber: row.serial_number,
      activationCode: canCopyActivationCode ? row.activation_code : maskActivationCode(row.activation_code),
      canCopyActivationCode,
      status: row.status,
      firmwareVersion: row.firmware_version,
      activatedAt: row.activated_at,
    }

    result[row.order_id] = [...(result[row.order_id] ?? []), dto]
  }

  return result
}

function getPublicationTitle(publication: InventoryUnitRow['publication']): string | null {
  if (!publication) return null
  if (Array.isArray(publication)) return publication[0]?.title ?? null
  return publication.title ?? null
}

function getItemTitle(orderItemId: string | null, itemTitleById: Map<string, string>): string {
  if (!orderItemId) return 'DittoBot'
  return itemTitleById.get(orderItemId) ?? 'DittoBot'
}
