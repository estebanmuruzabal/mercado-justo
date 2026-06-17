import type { ProductBaseSource } from '@/domains/marketplace/product-base/domain/product-base'

export const PRODUCT_BASE_SOURCE_LABELS: Record<ProductBaseSource, string> = {
  seed: 'Seed',
  community: 'Comunidad',
  admin: 'Admin',
}

export function productBaseSourceBadgeVariant(
  source: ProductBaseSource,
): 'default' | 'secondary' | 'outline' {
  if (source === 'seed') return 'secondary'
  if (source === 'community') return 'outline'
  return 'default'
}
