import type {
  DeviceLocation,
  DittoBotInventoryStatus,
  UserLocation,
} from './ditto-bot-inventory-unit'
import { resolveInitialDeviceLocation } from './device-location.policy'

export type ActivationCandidate = {
  serialNumber: string
  activationCode: string
  status: DittoBotInventoryStatus
  ownerUserId: string | null
}

export type ActivationInput = {
  serialNumber: string
  activationCode: string
}

export class DittoBotActivationError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'ALREADY_ACTIVATED' | 'INVALID_CODE' | 'INVALID_STATUS',
  ) {
    super(message)
    this.name = 'DittoBotActivationError'
  }
}

export function normalizeSerialNumber(serial: string): string {
  return serial.trim().toUpperCase()
}

export function normalizeActivationCode(code: string): string {
  return code.trim().toUpperCase()
}

export function assertActivatableUnit(
  candidate: ActivationCandidate | null,
  input: ActivationInput,
): asserts candidate is ActivationCandidate {
  if (!candidate) {
    throw new DittoBotActivationError(
      'No se encontró un dispositivo con ese número de serie.',
      'NOT_FOUND',
    )
  }

  if (candidate.ownerUserId !== null || candidate.status === 'activated') {
    throw new DittoBotActivationError(
      'Este dispositivo ya fue activado.',
      'ALREADY_ACTIVATED',
    )
  }

  if (candidate.status === 'retired') {
    throw new DittoBotActivationError(
      'Este dispositivo no está disponible para activación.',
      'INVALID_STATUS',
    )
  }

  const normalizedSerial = normalizeSerialNumber(input.serialNumber)
  const normalizedCode = normalizeActivationCode(input.activationCode)

  if (
    normalizeSerialNumber(candidate.serialNumber) !== normalizedSerial ||
    normalizeActivationCode(candidate.activationCode) !== normalizedCode
  ) {
    throw new DittoBotActivationError(
      'El código de activación no es válido.',
      'INVALID_CODE',
    )
  }
}

export function buildActivationPatch(
  userId: string,
  userLocation: UserLocation | null,
  inheritsUserLocation: boolean,
  activatedAt: string = new Date().toISOString(),
): {
  ownerUserId: string
  status: 'activated'
  activatedAt: string
  location: DeviceLocation
  inheritsUserLocation: boolean
} {
  const location =
    resolveInitialDeviceLocation(inheritsUserLocation, userLocation) ?? {
      lat: null,
      lng: null,
      region: null,
    }

  return {
    ownerUserId: userId,
    status: 'activated',
    activatedAt,
    location,
    inheritsUserLocation,
  }
}
