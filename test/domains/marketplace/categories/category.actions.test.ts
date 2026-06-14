import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/domains/marketplace/categories/application/actions/category.actions'
import { assertPermission } from '@/shared/auth/guards/require-staff'
import { createClient } from '@/shared/database/supabase/server'
import { getCategoryById, listCategoriesForAdmin } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { ROLES } from '@/domains/users/domain/roles'

vi.mock('@/shared/auth/guards/require-staff')
vi.mock('@/shared/database/supabase/server')
vi.mock('@/domains/marketplace/categories/application/queries/admin-categories.queries')
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const validPayload = {
  name: 'Alimentos',
  parentId: null,
  isVisible: true,
  listingType: 'product' as const,
}

describe('category.actions', () => {
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()

  const mockSupabase = {
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnValue({ error: null }),
      update: mockUpdate.mockReturnValue({ eq: mockEq.mockReturnValue({ error: null }) }),
      delete: mockDelete.mockReturnValue({ eq: mockEq.mockReturnValue({ error: null }) }),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(getCategoryById).mockResolvedValue(null)
    vi.mocked(listCategoriesForAdmin).mockResolvedValue([])
  })

  it('allows super-admin to create a category', async () => {
    vi.mocked(assertPermission).mockResolvedValue({
      userId: 'admin-1',
      role: ROLES.SUPER_ADMIN,
    })

    await expect(createCategoryAction(validPayload)).resolves.toBeUndefined()
    expect(assertPermission).toHaveBeenCalledWith('categories:manage')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('forbids seller from creating a category', async () => {
    vi.mocked(assertPermission).mockRejectedValue(new Error('Forbidden'))

    await expect(createCategoryAction(validPayload)).rejects.toThrow('Forbidden')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('forbids moderator from updating a category', async () => {
    vi.mocked(assertPermission).mockRejectedValue(new Error('Forbidden'))

    await expect(
      updateCategoryAction('11111111-1111-1111-1111-111111111111', validPayload),
    ).rejects.toThrow('Forbidden')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects parent with a different listing type', async () => {
    vi.mocked(assertPermission).mockResolvedValue({
      userId: 'admin-1',
      role: ROLES.SUPER_ADMIN,
    })
    vi.mocked(getCategoryById).mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Servicios',
      parentId: null,
      isVisible: true,
      listingType: 'service',
      createdAt: new Date().toISOString(),
    })

    await expect(
      createCategoryAction({
        ...validPayload,
        parentId: '22222222-2222-2222-2222-222222222222',
      }),
    ).rejects.toThrow('La subcategoría debe tener el mismo tipo de listing que su categoría padre.')
  })

  it('maps delete restrict errors to a readable message', async () => {
    vi.mocked(assertPermission).mockResolvedValue({
      userId: 'admin-1',
      role: ROLES.SUPER_ADMIN,
    })

    const deleteEq = vi.fn().mockReturnValue({
      error: { code: '23503', message: 'foreign key violation' },
    })
    const deleteChain = vi.fn().mockReturnValue({ eq: deleteEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ delete: deleteChain }),
    } as never)

    await expect(
      deleteCategoryAction('11111111-1111-1111-1111-111111111111'),
    ).rejects.toThrow('No se puede eliminar: hay publicaciones que usan esta categoría.')
  })
})
