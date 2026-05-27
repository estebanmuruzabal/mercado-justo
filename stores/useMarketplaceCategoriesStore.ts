'use client'

import { create } from 'zustand'

import type { ListingType } from '@/lib/listing'

export type MarketplaceCategoryOption = {
  id: string
  name: string
  listingType: ListingType
}

type MarketplaceCategoriesState = {
  categories: MarketplaceCategoryOption[]
  setCategories: (categories: MarketplaceCategoryOption[]) => void
}

export const useMarketplaceCategoriesStore = create<MarketplaceCategoriesState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
}))
