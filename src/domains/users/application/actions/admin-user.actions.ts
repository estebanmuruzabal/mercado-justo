'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { assertSuperAdmin } from '@/shared/auth/guards/require-staff'
import { createAdminClient } from '@/shared/database/admin-client'
import { withAudit } from '@/shared/database/admin-audit'
import { ADMIN_USERS_PATH } from '@/shared/routing/routes'
import { ROLE_LIST, type Role } from '@/domains/users/domain/roles'
import { type UserStatus } from '@/domains/logistics/domain/types'
import { listUserActivityForAdmin } from '@/domains/users/application/queries/admin-users.queries'

export type AdminActionResult = { success: true } | { success: false; error: string }

const userIdSchema = z.string().uuid()

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(1, 'El nombre es obligatorio.').max(120),
  email: z.string().trim().email('Email inválido.').max(255),
})

const changeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().refine((v): v is Role => ROLE_LIST.includes(v as Role), 'Rol inválido.'),
})

const suspendSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Indicá un motivo.').max(500),
})

async function setUserStatus(
  userId: string,
  status: UserStatus,
  extra: Record<string, unknown>,
  action: string,
): Promise<AdminActionResult> {
  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      { action, entityType: 'user', entityId: userId, metadata: { status, ...extra } },
      async () => {
        const { error } = await admin
          .from('user')
          .update({ status, ...extra } as never)
          .eq('id', userId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_USERS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el usuario.',
    }
  }
}

export async function updateUserAction(
  input: z.input<typeof updateUserSchema>,
): Promise<AdminActionResult> {
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'user.update',
        entityType: 'user',
        entityId: parsed.data.userId,
        metadata: { fullName: parsed.data.fullName, email: parsed.data.email },
      },
      async () => {
        const { error } = await admin
          .from('user')
          .update({
            full_name: parsed.data.fullName,
            email: parsed.data.email,
          } as never)
          .eq('id', parsed.data.userId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_USERS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo editar el usuario.',
    }
  }
}

export async function changeUserRoleAction(
  input: z.input<typeof changeRoleSchema>,
): Promise<AdminActionResult> {
  const parsed = changeRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const vendorRoles = ['seller', 'seller-admin', 'property-admin'] as const
  if (vendorRoles.includes(parsed.data.role as (typeof vendorRoles)[number])) {
    return { success: false, error: 'Los vendedores se gestionan desde la pantalla de Vendedores.' }
  }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      {
        action: 'user.change_role',
        entityType: 'user',
        entityId: parsed.data.userId,
        metadata: { role: parsed.data.role },
      },
      async () => {
        const { error } = await admin
          .from('user')
          .update({ role: parsed.data.role } as never)
          .eq('id', parsed.data.userId)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_USERS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo cambiar el rol.',
    }
  }
}

export async function suspendUserAction(
  input: z.input<typeof suspendSchema>,
): Promise<AdminActionResult> {
  const parsed = suspendSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  return setUserStatus(
    parsed.data.userId,
    'suspended',
    {
      suspended_at: new Date().toISOString(),
      suspension_reason: parsed.data.reason,
    },
    'user.suspend',
  )
}

export async function banUserAction(userId: string): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return { success: false, error: 'Usuario inválido.' }

  return setUserStatus(
    parsed.data,
    'banned',
    { suspended_at: new Date().toISOString(), suspension_reason: 'Cuenta baneada por administración.' },
    'user.ban',
  )
}

export async function reactivateUserAction(userId: string): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return { success: false, error: 'Usuario inválido.' }

  return setUserStatus(
    parsed.data,
    'active',
    { suspended_at: null, suspension_reason: null },
    'user.reactivate',
  )
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return { success: false, error: 'Usuario inválido.' }

  try {
    const actor = await assertSuperAdmin()
    const admin = createAdminClient()

    await withAudit(
      actor,
      { action: 'user.delete', entityType: 'user', entityId: parsed.data },
      async () => {
        const { error } = await admin.auth.admin.deleteUser(parsed.data)
        if (error) throw error
      },
    )

    revalidatePath(ADMIN_USERS_PATH)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el usuario.',
    }
  }
}

export async function getUserActivityAction(userId: string) {
  await assertSuperAdmin()
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) return []
  return listUserActivityForAdmin(parsed.data)
}
