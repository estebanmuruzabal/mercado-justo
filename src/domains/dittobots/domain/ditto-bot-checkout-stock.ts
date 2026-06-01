export class DittoBotCheckoutStockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DittoBotCheckoutStockError'
  }
}

export type DittoBotCheckoutLine = {
  listingId: string
  quantity: number
}

export function aggregateCheckoutQuantitiesByListing(
  lines: DittoBotCheckoutLine[],
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const line of lines) {
    totals.set(line.listingId, (totals.get(line.listingId) ?? 0) + line.quantity)
  }
  return totals
}

export function validateDittoBotCheckoutStock(input: {
  dittoBotListingIds: Iterable<string>
  quantitiesByListingId: Map<string, number>
  stockByProductId: Map<string, number>
}): void {
  for (const listingId of input.dittoBotListingIds) {
    const requested = input.quantitiesByListingId.get(listingId) ?? 0
    const available = input.stockByProductId.get(listingId) ?? 0

    if (available <= 0) {
      throw new DittoBotCheckoutStockError(
        'No hay stock DittoBot disponible para este producto.',
      )
    }

    if (requested > available) {
      throw new DittoBotCheckoutStockError(
        `Stock insuficiente. Disponible: ${available}.`,
      )
    }
  }
}
