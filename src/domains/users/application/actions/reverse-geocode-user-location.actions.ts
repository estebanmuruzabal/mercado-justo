'use server'

import { z } from 'zod'

const reverseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export type UserLocationGeocodeResult = {
  city: string | null
  province: string | null
  displayName: string | null
}

function readLocality(address: Record<string, unknown>): string | null {
  const keys = ['city', 'town', 'village', 'municipality', 'hamlet', 'suburb', 'county'] as const
  for (const key of keys) {
    const value = address[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function readProvince(address: Record<string, unknown>): string | null {
  const keys = ['state', 'region', 'state_district', 'country'] as const
  for (const key of keys) {
    const value = address[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export async function reverseGeocodeUserLocation(input: z.input<typeof reverseSchema>): Promise<UserLocationGeocodeResult> {
  const parsed = reverseSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Coordenadas inválidas.')
  }

  const { latitude, longitude } = parsed.data

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('zoom', '14')
  url.searchParams.set('addressdetails', '1')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'mercado-justo/1.0',
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`No se pudo geocodificar (HTTP ${res.status}).`)
    }

    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida del servicio de geocoding.')
    }

    const obj = data as {
      display_name?: unknown
      address?: Record<string, unknown>
    }

    const displayName = typeof obj.display_name === 'string' ? obj.display_name : null
    const address = obj.address ?? {}

    return {
      city: readLocality(address),
      province: readProvince(address),
      displayName,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tiempo de espera al geocodificar. Probá nuevamente.')
    }
    throw err instanceof Error ? err : new Error('No se pudo obtener la ubicación.')
  } finally {
    clearTimeout(timeout)
  }
}
