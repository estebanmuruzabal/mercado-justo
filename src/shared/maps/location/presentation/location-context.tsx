'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { useLocation } from '@/shared/maps/location/presentation/hooks/use-location'

export type LocationContextValue = ReturnType<typeof useLocation>

const LocationContext = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const value = useLocation()

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationContext() {
  const ctx = useContext(LocationContext)
  if (!ctx) {
    throw new Error('useLocationContext must be used within LocationProvider')
  }
  return ctx
}
