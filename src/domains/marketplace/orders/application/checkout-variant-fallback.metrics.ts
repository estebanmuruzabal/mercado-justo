let fallbackHits = 0

export function recordCheckoutVariantFallbackHit(count = 1): void {
  if (count <= 0) return
  fallbackHits += count
}

export function getCheckoutVariantFallbackMetrics(): { fallbackHits: number } {
  return { fallbackHits }
}

/** @internal Vitest only */
export function resetCheckoutVariantFallbackMetrics(): void {
  fallbackHits = 0
}
