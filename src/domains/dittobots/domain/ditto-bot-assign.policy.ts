import type { DittoBotInventoryStatus } from './ditto-bot-inventory-unit'

export class DittoBotAssignError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DittoBotAssignError'
  }
}

export type AssignableUnit = {
  id: string
  status: DittoBotInventoryStatus
}

export function assertAssignableUnits(units: AssignableUnit[]): void {
  if (units.length === 0) {
    throw new DittoBotAssignError('Seleccioná al menos una unidad.')
  }

  const invalid = units.filter((u) => u.status !== 'available')
  if (invalid.length > 0) {
    throw new DittoBotAssignError(
      'Solo se pueden asignar unidades en estado available.',
    )
  }
}

export function assertRegionalVendor(isOfficial: boolean): void {
  if (isOfficial) {
    throw new DittoBotAssignError(
      'No se puede asignar stock al vendor oficial de catálogo.',
    )
  }
}
