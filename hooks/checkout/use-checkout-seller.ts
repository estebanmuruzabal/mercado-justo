'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export type CheckoutSellerInfo = {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

export function useCheckoutSeller(storeId: string | null) {
  const [seller, setSeller] = useState<CheckoutSellerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) {
      setSeller(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('store')
          .select('id, name, address, latitude, longitude')
          .eq('id', storeId)
          .maybeSingle()

        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
          setSeller(null)
          return
        }
        if (!data) {
          setSeller(null)
          return
        }

        const row = data as {
          id: string
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
        }

        setSeller({
          id: row.id,
          name: row.name,
          address: row.address,
          latitude: row.latitude,
          longitude: row.longitude,
        })
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar el vendedor.')
          setSeller(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [storeId])

  const sellerHasAddress = Boolean(seller?.address)

  return { seller, loading, error, sellerHasAddress }
}
