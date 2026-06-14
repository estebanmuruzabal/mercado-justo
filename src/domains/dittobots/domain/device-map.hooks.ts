/**
 * Future community map layers — domain hooks only (R5.4 STOP GATE).
 * No runtime map endpoints in R5.4.
 */

/** Mapa Comunitario Ditto — future layers (no runtime R5.4). */
export type DittoCommunityMapLayer =
  | 'dittobots'
  | 'ditto_clima'
  | 'productions'
  | 'public_protocols'
  | 'growers'

export type DittoCommunityMapQuery = {
  layers: DittoCommunityMapLayer[]
  publicDevicesOnly: true
  region?: string
}

/** Contract for future map data providers — not implemented in R5.4. */
export type DittoCommunityMapProvider = {
  query: (params: DittoCommunityMapQuery) => Promise<unknown[]>
}
