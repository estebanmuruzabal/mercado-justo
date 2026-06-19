export const PRODUCT_BASE_IDENTIFY_MAX_BYTES = 10 * 1024 * 1024

export const PRODUCT_BASE_IDENTIFY_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type ProductBaseIdentifyMimeType = (typeof PRODUCT_BASE_IDENTIFY_MIME_TYPES)[number]

export function isAllowedIdentifyMimeType(mimeType: string): mimeType is ProductBaseIdentifyMimeType {
  return (PRODUCT_BASE_IDENTIFY_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function validateIdentifyImageFile(file: File): string | null {
  if (!isAllowedIdentifyMimeType(file.type)) {
    return 'Formato no soportado. Usá JPG, PNG o WEBP.'
  }
  if (file.size > PRODUCT_BASE_IDENTIFY_MAX_BYTES) {
    return 'La imagen supera el máximo de 10 MB.'
  }
  return null
}
