'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createListing } from '@/server/services/listing.service'
import type { ListingCondition } from '@/types/listing'

const createListingSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  description: z.string().trim().min(1, 'La descripción es obligatoria.'),
  categoryId: z.string().uuid('Elegí una categoría válida.'),
  price: z.coerce.number().positive('El precio debe ser mayor a 0.'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo.'),
  condition: z.enum(['new', 'used']),
})

async function getCurrentUserId() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('No se pudo identificar al usuario autenticado.')
  }

  return data.user.id
}

function parseListingPayload(formData: FormData) {
  return createListingSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    condition: formData.get('condition'),
  })
}

export async function createListingAction(
  formData: FormData
): Promise<{ error: string } | void> {
  try {
    const parsed = parseListingPayload(formData)

    if (!parsed.success) {
      return {
        error:
          parsed.error.issues[0]?.message ??
          'Revisá los datos de la publicación.',
      }
    }

    const userId = await getCurrentUserId()

    await createListing(userId, {
      title: parsed.data.title,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      price: parsed.data.price,
      stock: parsed.data.stock,
      condition: parsed.data.condition as ListingCondition,
    })
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo crear la publicación.',
    }
  }

  revalidatePath('/dashboard/listings')
  revalidatePath('/profile')
  redirect('/dashboard/listings')
}

