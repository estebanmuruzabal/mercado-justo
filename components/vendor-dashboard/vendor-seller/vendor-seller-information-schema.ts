import * as z from 'zod'

export const vendorSellerInformationSchema = z.object({
  businessName: z.string().trim().min(2, 'El nombre del negocio es requerido.'),
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
    address?: string | null
    instagram?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null,
): VendorSellerInformationFormInput {
  return {
    businessName: store?.name ?? '',
    address: store?.address ?? '',
    instagram: store?.instagram ?? '',
    latitude: store?.latitude == null ? '' : String(store.latitude),
    longitude: store?.longitude == null ? '' : String(store.longitude),
  }
}
