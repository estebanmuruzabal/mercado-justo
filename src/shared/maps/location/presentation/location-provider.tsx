'use client'

import type { ReactNode } from 'react'

import { LocationProvider as LocationContextProvider } from './location-context'
import { LocationModals } from './location-modals'

export function LocationProvider({ children }: { children: ReactNode }) {
  return (
    <LocationContextProvider>
      {children}
      <LocationModals />
    </LocationContextProvider>
  )
}
