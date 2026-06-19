import { useMutation } from '@tanstack/react-query'

import type { ProductBaseIdentifyResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

export function useProductBasePhotoIdentify(listingType: ListingType | null) {
  return useMutation({
    mutationFn: async (file: File): Promise<ProductBaseIdentifyResultDto[]> => {
      const formData = new FormData()
      formData.append('image', file)
      if (listingType) formData.append('listingType', listingType)

      const response = await fetch('/api/product-bases/identify', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json()) as ProductBaseIdentifyResultDto[] | { error?: string }
      if (!response.ok) {
        const message = 'error' in payload && payload.error ? payload.error : 'No se pudo identificar el producto.'
        throw new Error(message)
      }

      return payload as ProductBaseIdentifyResultDto[]
    },
  })
}
