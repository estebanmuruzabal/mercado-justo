'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { LatLng, LocationDraft, LocationMode, LocationSelection } from '@/lib/location/location-types'

type RequestStatus = 'idle' | 'loading' | 'error'

type LocationState = {
  mode: LocationMode | null
  onboardingSeen: boolean

  // Confirmado (se muestra en header)
  address: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  province: string | null

  // Draft (para modales)
  draft: LocationDraft
  requestStatus: RequestStatus
  error: string | null

  // Actions
  selectDelivery: (selection: LocationSelection) => void
  selectPickup: () => void
  updateAddressDraft: (draft: Partial<LocationDraft>) => void
  setRequestStatus: (status: RequestStatus, error?: string | null) => void
  markOnboardingSeen: () => void
  clear: () => void

  // Helpers (sincrónicos)
  getDraftLatLng: () => LatLng | null
  isDraftInResistencia: () => boolean
}

const DEFAULT_DRAFT: LocationDraft = {
  address: null,
  latitude: null,
  longitude: null,
  city: null,
  province: null,
  isInResistencia: false,
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      mode: null,
      onboardingSeen: false,

      address: null,
      latitude: null,
      longitude: null,
      city: null,
      province: null,

      draft: DEFAULT_DRAFT,
      requestStatus: 'idle',
      error: null,

      selectDelivery: (selection) => {
        set({
          mode: selection.mode,
          address: selection.address,
          latitude: selection.latitude,
          longitude: selection.longitude,
          city: selection.city,
          province: selection.province,
          error: null,
          requestStatus: 'idle',
          draft: { ...DEFAULT_DRAFT, address: selection.address, latitude: selection.latitude, longitude: selection.longitude, city: selection.city, province: selection.province, isInResistencia: true },
        })
      },

      selectPickup: () => {
        set({
          mode: 'pickup',
          // Pickup no requiere dirección todavía: dejamos address/draft intactos para no perder datos,
          // pero el modo queda marcado como pickup.
          error: null,
          requestStatus: 'idle',
        })
      },

      updateAddressDraft: (next) => {
        set((state) => {
          const merged: LocationDraft = {
            ...state.draft,
            ...next,
          }
          return { draft: merged }
        })
      },

      setRequestStatus: (status, error) => set({ requestStatus: status, error: error ?? null }),

      markOnboardingSeen: () => set({ onboardingSeen: true }),

      clear: () =>
        set({
          mode: null,
          onboardingSeen: false,
          address: null,
          latitude: null,
          longitude: null,
          city: null,
          province: null,
          draft: DEFAULT_DRAFT,
          requestStatus: 'idle',
          error: null,
        }),

      getDraftLatLng: () => {
        const d = get().draft
        if (d.latitude == null || d.longitude == null) return null
        return { latitude: d.latitude, longitude: d.longitude }
      },

      isDraftInResistencia: () => get().draft.isInResistencia,
    }),
    {
      name: 'mercado-justo.location',
      partialize: (state) => ({
        mode: state.mode,
        onboardingSeen: state.onboardingSeen,
        address: state.address,
        latitude: state.latitude,
        longitude: state.longitude,
        city: state.city,
        province: state.province,
      }),
    },
  ),
)

