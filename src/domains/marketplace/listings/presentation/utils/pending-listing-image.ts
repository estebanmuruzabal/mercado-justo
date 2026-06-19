import type { StoredIdentificationImage } from './listing-identification-image.storage'
import { dataUrlToFile } from './listing-identification-image.storage'

export type PendingListingImage = {
  id: string
  name: string
  type: string
  size: number
  previewUrl: string
  dataUrl: string
  origin: 'product-base-identification'
}

export function createPendingListingImageFromFile(file: File, dataUrl: string): PendingListingImage {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl: URL.createObjectURL(file),
    dataUrl,
    origin: 'product-base-identification',
  }
}

export async function createPendingListingImageFromStored(
  stored: StoredIdentificationImage,
): Promise<PendingListingImage> {
  const file = await dataUrlToFile(stored)
  return createPendingListingImageFromFile(file, stored.dataUrl)
}

export function revokePendingListingImagePreviews(pending: PendingListingImage[]): void {
  for (const image of pending) {
    URL.revokeObjectURL(image.previewUrl)
  }
}
