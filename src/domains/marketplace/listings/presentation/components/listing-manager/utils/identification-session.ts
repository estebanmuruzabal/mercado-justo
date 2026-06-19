import type { SellerProductBaseDetailDto } from '@/domains/marketplace/product-base/application/dto/seller-product-base.dto'
import { productBaseAllowsSellerListingImages } from '@/domains/marketplace/product-base/domain/product-base-image-policy'
import {
  clearIdentificationImageStorage,
  loadIdentificationImage,
} from '@/domains/marketplace/listings/presentation/utils/listing-identification-image.storage'
import {
  createPendingListingImageFromStored,
  revokePendingListingImagePreviews,
  type PendingListingImage,
} from '@/domains/marketplace/listings/presentation/utils/pending-listing-image'
import { uploadListingImageFiles } from '@/domains/marketplace/listings/presentation/utils/upload-listing-images'

export function cleanupIdentificationSession(pending: PendingListingImage[]): void {
  clearIdentificationImageStorage()
  revokePendingListingImagePreviews(pending)
}

export async function resolvePendingIdentificationImages(
  productBaseId: string,
  productBase: SellerProductBaseDetailDto,
): Promise<PendingListingImage[]> {
  if (!productBaseAllowsSellerListingImages(productBase.imageStrategy)) {
    clearIdentificationImageStorage()
    return []
  }

  const stored = loadIdentificationImage()
  if (!stored) return []

  if (stored.productBaseId && stored.productBaseId !== productBaseId) {
    clearIdentificationImageStorage()
    return []
  }

  return [await createPendingListingImageFromStored(stored)]
}

export async function uploadPendingListingImages(
  listingId: string,
  pending: PendingListingImage[],
): Promise<string[]> {
  if (pending.length === 0) return []

  const files = await Promise.all(
    pending.map(async (image) => {
      const response = await fetch(image.dataUrl)
      const blob = await response.blob()
      return new File([blob], image.name, { type: image.type })
    }),
  )

  return uploadListingImageFiles(listingId, files)
}
