import { describe, expect, it } from 'vitest'

import {
  assertAssignableUnits,
  assertRegionalVendor,
  DittoBotAssignError,
} from '@/domains/dittobots/domain/ditto-bot-assign.policy'
import {
  assertDittoBotCategory,
  assertDittoBotTags,
  DittoBotProductValidationError,
} from '@/domains/dittobots/domain/ditto-bot-product'
import {
  formatDittoBotSerial,
  generateDittoBotSerials,
} from '@/domains/dittobots/domain/ditto-bot-serial'
import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'

describe('ditto-bot-product validation', () => {
  const categories: AdminCategoryRow[] = [
    {
      id: 'parent-1',
      name: 'Tecnología',
      parentId: null,
      isVisible: true,
      listingType: 'product',
      createdAt: '',
    },
    {
      id: 'child-1',
      name: 'Sensores',
      parentId: 'parent-1',
      isVisible: true,
      listingType: 'product',
      createdAt: '',
    },
  ]

  it('requires at least one tag', () => {
    expect(() => assertDittoBotTags([])).toThrow(DittoBotProductValidationError)
    expect(assertDittoBotTags(['dittobot'])).toEqual(['dittobot'])
  })

  it('requires subcategory when parents exist', () => {
    expect(() => assertDittoBotCategory('parent-1', categories)).toThrow(
      DittoBotProductValidationError,
    )
    expect(assertDittoBotCategory('child-1', categories).id).toBe('child-1')
  })
})

describe('ditto-bot serial generation', () => {
  it('formats DTB-000001 style serials', () => {
    expect(formatDittoBotSerial('DTB-', 1)).toBe('DTB-000001')
    expect(formatDittoBotSerial('DTB-', 42)).toBe('DTB-000042')
  })

  it('generates sequential batch serials', () => {
    expect(generateDittoBotSerials({ prefix: 'DTB-', start: 5, quantity: 3 })).toEqual([
      'DTB-000005',
      'DTB-000006',
      'DTB-000007',
    ])
  })
})

describe('ditto-bot assign policy', () => {
  it('allows only available units', () => {
    expect(() =>
      assertAssignableUnits([
        { id: 'a', status: 'available' },
        { id: 'b', status: 'assigned' },
      ]),
    ).toThrow(DittoBotAssignError)
  })

  it('rejects official vendor assignment target', () => {
    expect(() => assertRegionalVendor(true)).toThrow(DittoBotAssignError)
  })
})
