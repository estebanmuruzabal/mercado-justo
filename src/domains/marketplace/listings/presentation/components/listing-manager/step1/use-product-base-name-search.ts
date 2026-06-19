import { useQuery } from '@tanstack/react-query'

import { searchProductBasesForSellerAction } from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

import { useDebouncedValue } from './use-debounced-value'

export function useProductBaseNameSearch(query: string, listingType: ListingType | null, enabled = true) {
  const debouncedQuery = useDebouncedValue(query, 300)
  const trimmed = debouncedQuery.trim()

  return useQuery({
    queryKey: ['product-base-search', trimmed, listingType],
    queryFn: () =>
      searchProductBasesForSellerAction({
        query: trimmed,
        listingType: listingType ?? undefined,
        limit: 20,
      }),
    enabled: enabled && trimmed.length >= 2 && Boolean(listingType),
  })
}
