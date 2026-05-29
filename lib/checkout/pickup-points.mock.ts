import type { PickupHub } from './types'

export const PICKUP_HUBS: PickupHub[] = [
  {
    id: 'ditto-van-centro',
    name: 'Ditto Van — Centro',
    address: 'Av. San Martín 1200',
    city: 'Resistencia',
    province: 'Chaco',
    latitude: -27.4514,
    longitude: -58.9867,
    scheduleLabel: 'Lun a Sáb · 9:00 – 20:00',
    costLabel: 'Gratis',
    kind: 'ditto_van',
  },
  {
    id: 'plaza-25-mayo',
    name: 'Plaza 25 de Mayo',
    address: 'Plaza 25 de Mayo',
    city: 'Resistencia',
    province: 'Chaco',
    latitude: -27.4489,
    longitude: -58.9835,
    scheduleLabel: 'Lun a Dom · 10:00 – 18:00',
    costLabel: 'Gratis',
    kind: 'plaza',
  },
]

export function getPickupHubById(id: string): PickupHub | undefined {
  return PICKUP_HUBS.find((h) => h.id === id)
}
