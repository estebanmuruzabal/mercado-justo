import * as z from 'zod'

import { isValidSlug, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from '@/domains/vendors/domain/slug'
import { isValidWhatsappNumber } from '@/domains/vendors/domain/whatsapp'

export const vendorSellerInformationSchema = z.object({
  businessName: z.string().trim().min(2, 'El nombre del negocio es requerido.'),
  slug: z
    .string()
    .trim()
    .min(SLUG_MIN_LENGTH, 'El slug es muy corto.')
    .max(SLUG_MAX_LENGTH, 'El slug es muy largo.')
    .refine(isValidSlug, 'Solo letras, números y guiones (ej: the-tree-kings).'),
  bio: z.string().trim().max(500, 'Máximo 500 caracteres.').optional(),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  allowFollowers: z.boolean(),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || isValidWhatsappNumber(v),
      'Número inválido. Incluí el código de país (ej: 5493624123456).',
    ),
  showWhatsapp: z.boolean(),
  address: z.string().trim().min(2, 'La dirección es requerida.'),
  instagram: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true
        if (!v.length) return true
        try {
          const url = new URL(v)
          const host = url.hostname.replace(/^www\./, '')
          return host === 'instagram.com' || host.endsWith('.instagram.com')
        } catch {
          return false
        }
      },
      'Instagram inválido. Usá una URL completa de instagram.com (ej: https://instagram.com/miemprendimiento).',
    ),
  latitude: z
    .string()
    .min(1, 'Latitud requerida.')
    .refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= -90 && n <= 90
    }, 'Latitud inválida.'),
  longitude: z
    .string()
    .min(1, 'Longitud requerida.')
    .refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= -180 && n <= 180
    }, 'Longitud inválida.'),
})

export type VendorSellerInformationFormInput = z.input<typeof vendorSellerInformationSchema>

export function vendorSellerInformationDefaults(
  store?: {
    name?: string | null
    slug?: string | null
    bio?: string | null
    bannerUrl?: string | null
    logoUrl?: string | null
    allowFollowers?: boolean | null
    whatsappNumber?: string | null
    showWhatsapp?: boolean | null
    address?: string | null
    instagram?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null,
): VendorSellerInformationFormInput {
  return {
    businessName: store?.name ?? '',
    slug: store?.slug ?? '',
    bio: store?.bio ?? '',
    bannerUrl: store?.bannerUrl ?? '',
    logoUrl: store?.logoUrl ?? '',
    allowFollowers: store?.allowFollowers ?? true,
    whatsappNumber: store?.whatsappNumber ?? '',
    showWhatsapp: store?.showWhatsapp ?? true,
    address: store?.address ?? '',
    instagram: store?.instagram ?? '',
    latitude: store?.latitude == null ? '' : String(store.latitude),
    longitude: store?.longitude == null ? '' : String(store.longitude),
  }
}
