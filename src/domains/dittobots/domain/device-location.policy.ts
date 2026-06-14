import type {
  DeviceLocation,
  DittoBotInventoryUnit,
  UserLocation,
} from './ditto-bot-inventory-unit'
import { isActivatedUnit } from './ditto-bot-inventory-unit'

export type DeviceLocationActor = {
  userId: string
  isSuperAdmin: boolean
}

export function resolveInitialDeviceLocation(
  inheritsUserLocation: boolean,
  userLocation: UserLocation | null,
): DeviceLocation | null {
  if (!inheritsUserLocation || !userLocation) {
    return { lat: null, lng: null, region: null }
  }

  if (userLocation.lat == null && userLocation.lng == null && !userLocation.region) {
    return { lat: null, lng: null, region: null }
  }

  return {
    lat: userLocation.lat,
    lng: userLocation.lng,
    region: userLocation.region,
  }
}

export function hasDeviceLocation(location: DeviceLocation): boolean {
  return location.lat != null && location.lng != null
}

export function filterPublicMapDevices(
  units: DittoBotInventoryUnit[],
): DittoBotInventoryUnit[] {
  return units.filter(
    (unit) =>
      unit.isPublicOnMap &&
      isActivatedUnit(unit) &&
      hasDeviceLocation(unit.location),
  )
}

export function canViewDeviceLocation(
  actor: DeviceLocationActor,
  device: Pick<DittoBotInventoryUnit, 'ownerUserId' | 'isPublicOnMap' | 'location' | 'status'>,
): boolean {
  if (actor.isSuperAdmin) return true
  if (device.ownerUserId === actor.userId) return true
  if (device.isPublicOnMap && isActivatedUnit(device) && hasDeviceLocation(device.location)) {
    return true
  }
  return false
}

export function deviceLocationFromUser(userLocation: UserLocation): DeviceLocation {
  return resolveInitialDeviceLocation(true, userLocation) ?? {
    lat: null,
    lng: null,
    region: null,
  }
}
