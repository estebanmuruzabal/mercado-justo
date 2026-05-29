'use server'

import { z } from 'zod'

import { isWithinResistencia } from '@/lib/location/validate-resistencia'
import type { ReverseGeocodeResult } from '@/lib/location/location-types'

const reverseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export async function reverseGeocodeToAddress(input: z.input<typeof reverseSchema>): Promise<ReverseGeocodeResult> {
  const parsed = reverseSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Coordenadas inválidas.')
  }

  const { latitude, longitude } = parsed.data
  const latLng = { latitude, longitude }

  if (!isWithinResistencia(latLng)) {
    throw new Error('La ubicación no parece estar en Resistencia, Chaco.')
  }

  // Nominatim reverse geocoding
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('zoom', '18')
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
      throw new Error(`No se pudo hacer reverse geocoding (HTTP ${res.status}).`)
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
    if (!displayName) {
      throw new Error('No pudimos encontrar la dirección para ese punto.')
    }

    const address = obj.address ?? {}
    const city =
      (typeof address.city === 'string' && address.city) ||
      (typeof address.town === 'string' && address.town) ||
      (typeof address.village === 'string' && address.village) ||
      'Resistencia'
    const province =
      (typeof address.state === 'string' && address.state) ||
      (typeof address.region === 'string' && address.region) ||
      'Chaco'

    return {
      address: displayName,
      city,
      province,
      latitude,
      longitude,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tiempo de espera al geocodificar. Probá nuevamente.')
    }
    throw err instanceof Error ? err : new Error('No se pudo obtener la dirección.')
  } finally {
    clearTimeout(timeout)
  }
}

