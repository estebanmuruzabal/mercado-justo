export type PurchasedDittoBotViewerKind = 'buyer' | 'super-admin' | 'vendor'

export function canViewFullActivationCode(viewerKind: PurchasedDittoBotViewerKind): boolean {
  return viewerKind === 'buyer' || viewerKind === 'super-admin'
}

export function maskActivationCode(code: string): string {
  const parts = code.split('-')

  if (parts.length >= 3) {
    return [parts[0], ...parts.slice(1).map((part) => '*'.repeat(part.length))].join('-')
  }

  if (code.length <= 4) return '*'.repeat(code.length)

  return `${code.slice(0, 4)}${'*'.repeat(code.length - 4)}`
}
