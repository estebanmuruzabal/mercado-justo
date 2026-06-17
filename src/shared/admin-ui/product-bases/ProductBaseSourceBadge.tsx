import type { ProductBaseSource } from '@/domains/marketplace/product-base/domain/product-base'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/utils/utils'

import {
  PRODUCT_BASE_SOURCE_LABELS,
  productBaseSourceBadgeVariant,
} from './product-base-source.utils'

export function ProductBaseSourceBadge({
  source,
  className,
}: {
  source: ProductBaseSource
  className?: string
}) {
  return (
    <Badge variant={productBaseSourceBadgeVariant(source)} className={cn('shrink-0', className)}>
      {PRODUCT_BASE_SOURCE_LABELS[source]}
    </Badge>
  )
}
