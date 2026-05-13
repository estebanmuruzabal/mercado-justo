'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserRoleByUserId } from '@/server/queries/user.queries'
import { ROLES, type Role } from '@/lib/roles'

type CategoryFormPayload = {
  name: string
  parentId: string | null
  isVisible: boolean
}

function assertRoleSuperAdmin(role: Role | null) {
  if (role !== ROLES.SUPER_ADMIN) {
    throw new Error('Forbidden')
  }
}

export async function createCategoryAction(values: CategoryFormPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Unauthorized')

  const role = await getUserRoleByUserId(data.user.id)
  assertRoleSuperAdmin(role)

  const name = values.name.trim()
  if (!name) throw new Error('Category name is required')

  const { error: insertError } = await supabase.from('category').insert({
    name,
    parent_id: values.parentId,
    is_visible: values.isVisible,
  } as never)

  if (insertError) throw insertError
}

export async function updateCategoryAction(id: string, values: CategoryFormPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Unauthorized')

  const role = await getUserRoleByUserId(data.user.id)
  assertRoleSuperAdmin(role)

  const name = values.name.trim()
  if (!name) throw new Error('Category name is required')

  const { error: updateError } = await supabase
    .from('category')
    .update({
      name,
      parent_id: values.parentId,
      is_visible: values.isVisible,
    } as never)
    .eq('id', id)

  if (updateError) throw updateError
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Unauthorized')

  const role = await getUserRoleByUserId(data.user.id)
  assertRoleSuperAdmin(role)

  const { error: deleteError } = await supabase.from('category').delete().eq('id', id)
  if (deleteError) throw deleteError
}

