'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { PERMISSIONS } from '@/shared/auth/permissions'
import {
  ADMIN_CATEGORIES_PATH,
  CATEGORIES_PATH,
  HOME_PATH,
} from '@/shared/routing/routes'
import { assertPermission } from '@/shared/auth/guards/require-staff'
import { createClient } from '@/shared/database/supabase/server'
import {
  getCategoryById,
  listCategoriesForAdmin,
} from '@/domains/marketplace/categories/application/queries/admin-categories.queries'

const listingTypeSchema = z.enum(['product', 'service', 'property'])

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  parentId: z.string().uuid().nullable(),
  isVisible: z.boolean(),
  listingType: listingTypeSchema,
})

export type CategoryFormPayload = z.infer<typeof categoryFormSchema>

function revalidateCategorySurfaces() {
  revalidatePath(ADMIN_CATEGORIES_PATH)
  revalidatePath(HOME_PATH)
  revalidatePath(CATEGORIES_PATH)
}

function mapCategoryMutationError(error: { code?: string; message?: string }): Error {
  if (error.code === '23503') {
    return new Error('No se puede eliminar: hay publicaciones que usan esta categoría.')
  }
  if (error.code === '23505') {
    return new Error('Ya existe una categoría con ese nombre.')
  }
  return new Error(error.message ?? 'No se pudo completar la operación.')
}

async function assertValidParent(
  categoryId: string | null,
  parentId: string | null,
  listingType: z.infer<typeof listingTypeSchema>,
) {
  if (!parentId) return

  if (categoryId && parentId === categoryId) {
    throw new Error('Una categoría no puede ser padre de sí misma.')
  }

  const parent = await getCategoryById(parentId)
  if (!parent) {
    throw new Error('La categoría padre no existe.')
  }

  if (parent.listingType !== listingType) {
    throw new Error('La subcategoría debe tener el mismo tipo de listing que su categoría padre.')
  }

  if (categoryId) {
    const all = await listCategoriesForAdmin()
    const byId = new Map(all.map((item) => [item.id, item]))
    let cursor: string | null = parentId

    while (cursor) {
      if (cursor === categoryId) {
        throw new Error('No se puede crear un ciclo en la jerarquía de categorías.')
      }
      cursor = byId.get(cursor)?.parentId ?? null
    }
  }
}

export async function createCategoryAction(values: CategoryFormPayload) {
  await assertPermission(PERMISSIONS.CATEGORIES_MANAGE)

  const parsed = categoryFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Datos inválidos.')
  }

  const { name, parentId, isVisible, listingType } = parsed.data
  await assertValidParent(null, parentId, listingType)

  const supabase = await createClient()
  const { error } = await supabase.from('category').insert({
    name,
    parent_id: parentId,
    is_visible: isVisible,
    listing_type: listingType,
  } as never)

  if (error) throw mapCategoryMutationError(error)

  revalidateCategorySurfaces()
}

export async function updateCategoryAction(id: string, values: CategoryFormPayload) {
  await assertPermission(PERMISSIONS.CATEGORIES_MANAGE)

  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) throw new Error('ID de categoría inválido.')

  const parsed = categoryFormSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Datos inválidos.')
  }

  const { name, parentId, isVisible, listingType } = parsed.data
  await assertValidParent(idParsed.data, parentId, listingType)

  const supabase = await createClient()
  const { error } = await supabase
    .from('category')
    .update({
      name,
      parent_id: parentId,
      is_visible: isVisible,
      listing_type: listingType,
    } as never)
    .eq('id', idParsed.data)

  if (error) throw mapCategoryMutationError(error)

  revalidateCategorySurfaces()
}

export async function deleteCategoryAction(id: string) {
  await assertPermission(PERMISSIONS.CATEGORIES_MANAGE)

  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) throw new Error('ID de categoría inválido.')

  const supabase = await createClient()
  const { error } = await supabase.from('category').delete().eq('id', idParsed.data)

  if (error) throw mapCategoryMutationError(error)

  revalidateCategorySurfaces()
}
