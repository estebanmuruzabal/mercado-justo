'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import {
  BECOME_VENDOR_PATH,
  PROFILE_PATH,
  VENDOR_DASHBOARD_PATH,
  VENDOR_LISTINGS_PATH,
  VENDOR_INFORMATION_PATH,
} from '@/lib/routes'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/roles'
import { createStore, generateUniqueSlug, getStoreByUserId } from '@/server/services/store.service'
import { isValidSlug, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, slugify } from '@/lib/vendor/slug'
import { isValidWhatsappNumber, normalizeWhatsappNumber } from '@/lib/vendor/whatsapp'

const updateSellerProfileSchema = z.object({
  businessName: z.string().trim().min(2, 'El nombre del negocio es requerido.'),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? slugify(v) : ''))
    .refine(
      (v) => v === '' || (v.length >= SLUG_MIN_LENGTH && v.length <= SLUG_MAX_LENGTH && isValidSlug(v)),
      'El slug debe tener entre 2 y 60 caracteres (solo letras, números y guiones).',
    ),
  bio: z
    .string()
    .trim()
    .max(500, 'La bio es demasiado larga (máx. 500 caracteres).')
    .optional()
    .transform((v) => (v && v.length ? v : null)),
  bannerUrl: z.string().url().nullish().or(z.literal('')).transform((v) => (v ? v : null)),
  logoUrl: z.string().url().nullish().or(z.literal('')).transform((v) => (v ? v : null)),
  allowFollowers: z.boolean().optional().default(true),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizeWhatsappNumber(v) : ''))
    .refine((v) => v === '' || isValidWhatsappNumber(v), 'Número de WhatsApp inválido.')
    .transform((v) => (v === '' ? null : v)),
  showWhatsapp: z.boolean().optional().default(true),
  address: z.string().trim().min(2, 'La dirección es requerida.'),
  instagram: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v : null))
    .refine(
      (v) => {
        if (!v) return true
        try {
          const url = new URL(v)
          return url.hostname.replace(/^www\./, '') === 'instagram.com' || url.hostname.endsWith('.instagram.com')
        } catch {
          return false
        }
      },
      'Instagram inválido. Usá una URL completa de instagram.com (ej: https://instagram.com/miemprendimiento).',
    ),
  latitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z
      .number({ required_error: 'Latitud requerida.', invalid_type_error: 'Latitud inválida.' })
      .min(-90, 'Latitud inválida.')
      .max(90, 'Latitud inválida.'),
  ),
  longitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z
      .number({ required_error: 'Longitud requerida.', invalid_type_error: 'Longitud inválida.' })
      .min(-180, 'Longitud inválida.')
      .max(180, 'Longitud inválida.'),
  ),
})

export type UpdateSellerProfileResult =
  | { success: true }
  | { success: false; error: string }

export async function updateSellerProfileAction(input: z.input<typeof updateSellerProfileSchema>) {
  try {
    const parsed = updateSellerProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No hay sesión activa.' }

    const store = await getStoreByUserId(user.id)
    const {
      businessName,
      slug,
      bio,
      bannerUrl,
      logoUrl,
      allowFollowers,
      whatsappNumber,
      showWhatsapp,
      address,
      instagram,
      latitude,
      longitude,
    } = parsed.data

    if (!store) {
      // Activación (create store + set seller role).
      const uniqueSlug = await generateUniqueSlug(slug || businessName)
      await createStore(user.id, {
        name: businessName,
        slug: uniqueSlug,
        bio,
        bannerUrl,
        logoUrl,
        allowFollowers,
        whatsappNumber,
        showWhatsapp,
        address,
        instagram,
        latitude,
        longitude,
        mode: 'online',
      })

      // Ensure user can access seller-only actions.
      const { error: roleError } = await supabase
        .from('user' as never)
        .update({ role: ROLES.SELLER } as never)
        .eq('id', user.id)

      if (roleError) throw roleError
    } else {
      // Only recompute the slug when the user actually changed it, to keep the
      // public URL stable otherwise.
      const desiredSlug = slug || store.slug || businessName
      const nextSlug =
        desiredSlug === store.slug ? store.slug : await generateUniqueSlug(desiredSlug, user.id)

      const { error } = await supabase.from('store').update({
        name: businessName,
        slug: nextSlug,
        bio,
        banner_url: bannerUrl,
        logo_url: logoUrl,
        allow_followers: allowFollowers,
        whatsapp_number: whatsappNumber,
        show_whatsapp: showWhatsapp,
        address,
        instagram,
        latitude,
        longitude,
      } as never).eq('id', user.id)

      if (error) throw error

      if (nextSlug) revalidatePath(`/vendor/${nextSlug}`)
      if (store.slug && store.slug !== nextSlug) revalidatePath(`/vendor/${store.slug}`)
    }

    revalidatePath(BECOME_VENDOR_PATH)
    revalidatePath(VENDOR_INFORMATION_PATH)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo guardar.' }
  }
}

export type DeleteSellerModeResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteSellerModeAction(): Promise<DeleteSellerModeResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'No hay sesión activa.' }

    const store = await getStoreByUserId(user.id)
    if (!store) {
      // Already not a seller; treat as success.
      revalidatePath(BECOME_VENDOR_PATH)
      revalidatePath(VENDOR_INFORMATION_PATH)
      return { success: true }
    }

    const service = createServiceClient()

    // Orders block store deletion (FK uses ON DELETE RESTRICT), so remove them first.
    const { error: ordersError } = await service.from('order').delete().eq('seller_id', user.id)
    if (ordersError) throw ordersError

    const { error: roleError } = await service
      .from('user' as never)
      .update({ role: ROLES.USER } as never)
      .eq('id', user.id)
    if (roleError) throw roleError

    // Cascade will remove listings and their variants (and cart/order items via their own FKs).
    const { error: storeError } = await service.from('store').delete().eq('id', user.id)
    if (storeError) throw storeError

    revalidatePath(BECOME_VENDOR_PATH)
    revalidatePath(VENDOR_DASHBOARD_PATH)
    revalidatePath(VENDOR_INFORMATION_PATH)
    revalidatePath(VENDOR_LISTINGS_PATH)
    revalidatePath(PROFILE_PATH)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo eliminar el modo vendedor.' }
  }
}

