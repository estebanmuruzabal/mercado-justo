export type DittoBotSettings = {
  requiresActivation: boolean
  autoGenerateSerial: boolean
  autoGenerateActivationCode: boolean
  supportsOta: boolean
  requiresOwner: boolean
  requiresVendorAssignment: boolean
  requiresDeviceLink: boolean
}

export const DEFAULT_DITTO_BOT_SETTINGS: DittoBotSettings = {
  requiresActivation: true,
  autoGenerateSerial: true,
  autoGenerateActivationCode: true,
  supportsOta: false,
  requiresOwner: true,
  requiresVendorAssignment: true,
  requiresDeviceLink: false,
}

export function normalizeDittoBotSettings(raw: unknown): DittoBotSettings {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    requiresActivation: obj.requiresActivation !== false,
    autoGenerateSerial: obj.autoGenerateSerial !== false,
    autoGenerateActivationCode: obj.autoGenerateActivationCode !== false,
    supportsOta: obj.supportsOta === true,
    requiresOwner: obj.requiresOwner !== false,
    requiresVendorAssignment: obj.requiresVendorAssignment !== false,
    requiresDeviceLink: obj.requiresDeviceLink === true,
  }
}
