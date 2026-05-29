'use client'

import { useMemo } from 'react'

import { addDistanceToListings } from '@/lib/location/add-distance-to-listings'
import { isFiniteLatLng } from '@/lib/location/coordinates'
import { haversineDistanceKm } from '@/lib/location/distance'
import { useMarketplaceFiltersStore } from '@/stores/useMarketplaceFiltersStore'
import { useUserCoordinates } from '@/stores/useUserLocationStore'
import type { MarketplaceListing, MarketplaceListingWithDistance } from '@/types/marketplace'

function applyFilters(
  listings: MarketplaceListing[],
  filters: ReturnType<typeof useMarketplaceFiltersStore.getState>,
  userCoords: ReturnType<typeof useUserCoordinates>,
): MarketplaceListing[] {
  let result = listings

  if (filters.listingType.length > 0) {
    result = result.filter((l) => filters.listingType.includes(l.listingType))
  }

  if (filters.category.length > 0) {
    result = result.filter((l) => filters.category.includes(l.categoryId))
  }

  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase()
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.storeName.toLowerCase().includes(q) ||
        (l.categoryName?.toLowerCase().includes(q) ?? false),
    )
  }

  if (filters.minPrice !== null) {
    result = result.filter((l) => l.price >= filters.minPrice!)
  }

  if (filters.maxPrice !== null) {
    result = result.filter((l) => l.price <= filters.maxPrice!)
  }

  if (isFiniteLatLng(userCoords)) {
    result = result.filter((l) => {
      const coords = { latitude: l.latitude ?? undefined, longitude: l.longitude ?? undefined }
      if (!isFiniteLatLng(coords)) return false
      return haversineDistanceKm(userCoords, coords) <= filters.radiusKm
    })
  }

  // Viewport bounds are synced for future map UX; do not filter the feed here
  // because fitBounds + setMapBounds created an update loop that crashed the app.

  return result
}

function applySort(
  listings: MarketplaceListingWithDistance[],
  sortBy: ReturnType<typeof useMarketplaceFiltersStore.getState>['sortBy'],
): MarketplaceListingWithDistance[] {
  const sorted = [...listings]

  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0
        if (a.distanceKm === null) return 1
        if (b.distanceKm === null) return -1
        return a.distanceKm - b.distanceKm
      })
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'newest':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    default:
      return sorted
  }
}

export function useMarketplaceListings(listings: MarketplaceListing[]) {
  const userCoords = useUserCoordinates()
  const listingType = useMarketplaceFiltersStore((s) => s.listingType)
  const category = useMarketplaceFiltersStore((s) => s.category)
  const radiusKm = useMarketplaceFiltersStore((s) => s.radiusKm)
  const minPrice = useMarketplaceFiltersStore((s) => s.minPrice)
  const maxPrice = useMarketplaceFiltersStore((s) => s.maxPrice)
  const searchQuery = useMarketplaceFiltersStore((s) => s.searchQuery)
  const sortBy = useMarketplaceFiltersStore((s) => s.sortBy)

  return useMemo(() => {
    const filters = {
      listingType,
      category,
      radiusKm,
      minPrice,
      maxPrice,
      searchQuery,
      sortBy,
      mapBounds: null,
    } as ReturnType<typeof useMarketplaceFiltersStore.getState>

    const filtered = applyFilters(listings, filters, userCoords)
    const enriched = addDistanceToListings(filtered, userCoords)
    return applySort(enriched, sortBy)
  }, [
    listings,
    userCoords,
    listingType,
    category,
    radiusKm,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy,
  ])
}

export function useMapListings(listings: MarketplaceListingWithDistance[]) {
  return useMemo(
    () =>
      listings.filter((l) =>
        isFiniteLatLng({ latitude: l.latitude ?? undefined, longitude: l.longitude ?? undefined }),
      ),
    [listings],
  )
}
