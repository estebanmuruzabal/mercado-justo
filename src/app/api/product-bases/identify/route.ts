import { NextResponse } from 'next/server'

import { createClient } from '@/shared/database/supabase/server'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { ROLES, type Role } from '@/domains/users/domain/roles'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import { identifyProductBasesFromImage } from '@/domains/marketplace/product-base/application/services/product-base-identification.service'
import {
  isAllowedIdentifyMimeType,
  PRODUCT_BASE_IDENTIFY_MAX_BYTES,
} from '@/domains/marketplace/product-base/domain/product-base-image-validation'

function assertSellerOrAdmin(role: Role | null) {
  if (role !== ROLES.SUPER_ADMIN && role !== ROLES.SELLER && role !== ROLES.SELLER_ADMIN) {
    throw new Error('Forbidden')
  }
}

function parseListingType(value: FormDataEntryValue | null): ListingType | undefined {
  if (typeof value !== 'string' || !value) return undefined
  const allowed: ListingType[] = ['product', 'service', 'property', 'dittobot', 'experience']
  return allowed.includes(value as ListingType) ? (value as ListingType) : undefined
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const store = await getStoreByUserId(user.id)
    if (!store) {
      return NextResponse.json({ error: 'Debés activar el modo vendedor.' }, { status: 403 })
    }

    const role = await getUserRoleByUserId(user.id)
    assertSellerOrAdmin(role)

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Se requiere multipart/form-data.' }, { status: 400 })
    }

    const formData = await request.formData()
    const imageEntry = formData.get('image')

    if (!(imageEntry instanceof File)) {
      return NextResponse.json({ error: 'Campo image requerido.' }, { status: 400 })
    }

    if (!isAllowedIdentifyMimeType(imageEntry.type)) {
      return NextResponse.json({ error: 'Formato no soportado. Usá JPG, PNG o WEBP.' }, { status: 400 })
    }

    if (imageEntry.size > PRODUCT_BASE_IDENTIFY_MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen supera el máximo de 10 MB.' }, { status: 400 })
    }

    const arrayBuffer = await imageEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const listingType = parseListingType(formData.get('listingType'))

    const matches = await identifyProductBasesFromImage({
      image: { buffer, mimeType: imageEntry.type },
      listingType,
      limit: 5,
    })

    return NextResponse.json(matches)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al identificar el producto.'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
