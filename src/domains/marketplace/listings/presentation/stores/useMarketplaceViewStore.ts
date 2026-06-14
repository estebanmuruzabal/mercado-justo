'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MarketplaceViewMode = 'list' | 'map' | 'hybrid'

type MarketplaceViewState = {
  viewMode: MarketplaceViewMode
  setViewMode: (mode: MarketplaceViewMode) => void
}

export const useMarketplaceViewStore = create<MarketplaceViewState>()(
  persist(
    (set) => ({
      viewMode: 'hybrid',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'mercado-justo.marketplace-view',
    },
  ),
)
