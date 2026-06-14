import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildDittoBotSaleLines,
  completeDittoBotSaleForOrder,
} from '@/domains/dittobots/application/commands/complete-ditto-bot-sale.command'
import { createServiceClient } from '@/shared/database/supabase/service'

vi.mock('@/shared/database/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

describe('completeDittoBotSaleForOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds sale lines only for DittoBot order items', () => {
    const lines = buildDittoBotSaleLines(
      [
        { id: 'item-dtb', listing_id: 'dtb-product', quantity: 1 },
        { id: 'item-normal', listing_id: 'normal-product', quantity: 3 },
      ],
      ['dtb-product'],
    )

    expect(lines).toEqual([
      {
        orderItemId: 'item-dtb',
        productId: 'dtb-product',
        quantity: 1,
      },
    ])
  })

  it('marks assigned inventory units as sold for the buyer', async () => {
    const updates: Array<{ payload: Record<string, unknown>; ids: string[] }> = []
    const service = {
      from: (table: string) => {
        expect(table).toBe('ditto_bot_inventory_unit')

        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    is: () => ({
                      order: () => ({
                        limit: async () => ({
                          data: [{ id: 'unit-1' }],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            in: (_column: string, ids: string[]) => ({
              eq: () => ({
                select: async () => {
                  updates.push({ payload, ids })
                  return { data: ids.map((id) => ({ id })), error: null }
                },
              }),
            }),
          }),
        }
      },
    }

    vi.mocked(createServiceClient).mockReturnValue(service as never)

    const result = await completeDittoBotSaleForOrder({
      orderId: 'order-1',
      buyerUserId: 'buyer-1',
      sellerVendorId: 'vendor-1',
      lines: [{ orderItemId: 'item-1', productId: 'dtb-product', quantity: 1 }],
    })

    expect(result.soldUnitIds).toEqual(['unit-1'])
    expect(updates).toHaveLength(1)
    expect(updates[0]?.ids).toEqual(['unit-1'])
    expect(updates[0]?.payload).toMatchObject({
      status: 'sold',
      owner_user_id: 'buyer-1',
      seller_vendor_id: 'vendor-1',
      order_id: 'order-1',
      order_item_id: 'item-1',
    })
    expect(updates[0]?.payload.sold_at).toEqual(expect.any(String))
  })
})
