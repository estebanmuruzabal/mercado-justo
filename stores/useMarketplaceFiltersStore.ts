'use client'

import { create } from 'zustand'

import type { ListingType } from '@/lib/listing'

export type MarketplaceSortBy = 'distance' | 'price_asc' | 'price_desc' | 'newest'

export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

type MarketplaceFiltersState = {
  listingType: ListingType[]
  category: string[]
  radiusKm: number
  minPrice: number | null
  maxPrice: number | null
  deliveryAvailable: boolean
  pickupAvailable: boolean
  searchQuery: string
  sortBy: MarketplaceSortBy
  mapBounds: MapBounds | null
  setListingTypes: (types: ListingType[]) => void
  toggleListingType: (type: ListingType) => void
  setCategories: (ids: string[]) => void
  toggleCategory: (id: string) => void
  setRadiusKm: (radiusKm: number) => void
  setMinPrice: (minPrice: number | null) => void
  setMaxPrice: (maxPrice: number | null) => void
  setDeliveryAvailable: (value: boolean) => void
  setPickupAvailable: (value: boolean) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: MarketplaceSortBy) => void
  setMapBounds: (bounds: MapBounds | null) => void
  resetFilters: () => void
}

const DEFAULT_STATE = {
  listingType: [] as ListingType[],
  category: [] as string[],
  radiusKm: 10,
  minPrice: null as number | null,
  maxPrice: null as number | null,
  deliveryAvailable: false,
  pickupAvailable: false,
  searchQuery: '',
  sortBy: 'distance' as MarketplaceSortBy,
  mapBounds: null as MapBounds | null,
}

export const useMarketplaceFiltersStore = create<MarketplaceFiltersState>((set) => ({
  ...DEFAULT_STATE,

  setListingTypes: (types) => set({ listingType: types }),
  toggleListingType: (type) =>
    set((state) => ({
      listingType: state.listingType.includes(type)
        ? state.listingType.filter((t) => t !== type)
        : [...state.listingType, type],
    })),
  setCategories: (ids) => set({ category: ids }),
  toggleCategory: (id) =>
    set((state) => ({
      category: state.category.includes(id)
        ? state.category.filter((c) => c !== id)
        : [...state.category, id],
    })),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setDeliveryAvailable: (value) => set({ deliveryAvailable: value }),
  setPickupAvailable: (value) => set({ pickupAvailable: value }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  resetFilters: () => set({ ...DEFAULT_STATE }),
}))
