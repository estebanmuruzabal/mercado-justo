'use server'

import { z } from 'zod'

const geocodeSchema = z.object({
  address: z.string().trim().min(2),
})

type LatLng = { latitude: number; longitude: number }

// Approx bounding box for Resistencia, Chaco (Argentina).
const BOUNDS = {
  south: -27.70,
  north: -27.30,
  west: -59.30,
  east: -58.60,
} as const

export async function geocodeAddressToLatLng(input: z.input<typeof geocodeSchema>): Promise<LatLng> {
  const parsed = geocodeSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dirección inválida.')
  }

  const query = `${parsed.data.address}, Resistencia, Chaco, Argentina`

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', query)
  url.searchParams.set('bounded', '1')
  // viewbox expects: left,top,right,bottom
  url.searchParams.set(
    'viewbox',
    `${BOUNDS.west},${BOUNDS.north},${BOUNDS.east},${BOUNDS.south}`,
  )

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Nominatim recommends a user agent; use a generic one for now.
        'User-Agent': 'mercado-justo/1.0',
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`No se pudo geocodificar (HTTP ${res.status}).`)
    }

    const data: Array<{ lat: string; lon: string }> = await res.json()
    const first = data[0]
    if (!first) {
      throw new Error('No pudimos encontrar tu ubicación en Resistencia, Chaco.')
    }

    const latitude = Number(first.lat)
    const longitude = Number(first.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Coordenadas inválidas.')
    }

    if (
      latitude < BOUNDS.south ||
      latitude > BOUNDS.north ||
      longitude < BOUNDS.west ||
      longitude > BOUNDS.east
    ) {
      throw new Error('La dirección no parece estar en Resistencia, Chaco.')
    }

    return { latitude, longitude }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tiempo de espera al geocodificar. Probá nuevamente.')
    }
    throw err instanceof Error ? err : new Error('No se pudo geocodificar.')
  } finally {
    clearTimeout(timeout)
  }
}

