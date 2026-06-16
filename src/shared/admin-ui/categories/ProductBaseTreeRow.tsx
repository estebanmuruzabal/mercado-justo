'use client'

import { Package } from 'lucide-react'

import { ProductBaseActions } from '@/shared/admin-ui/categories/ProductBaseActions'
import type {
  ProductBaseTreeActionHandlers,
  ProductBaseTreeItem,
} from '@/shared/admin-ui/categories/types/category-tree.types'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/utils/utils'

const INDENT_PX = 20

function statusVariant(status: ProductBaseTreeItem['status']) {
  if (status === 'ACTIVE') return 'default'
  if (status === 'DRAFT') return 'secondary'
  return 'outline'
}

type ProductBaseTreeRowProps = {
  productBase: ProductBaseTreeItem
  depth: number
  actionHandlers: ProductBaseTreeActionHandlers
  disabled?: boolean
  isLoading?: boolean
}

export function ProductBaseTreeRow({
  productBase,
  depth,
  actionHandlers,
  disabled = false,
  isLoading = false,
}: ProductBaseTreeRowProps) {
  return (
    <div role='treeitem'>
      <button
        type='button'
        style={{ paddingLeft: `${depth * INDENT_PX + 8}px` }}
        className={cn(
          'group flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2.5 text-left transition-colors',
          'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20',
          disabled && 'pointer-events-none opacity-60',
        )}
        onClick={() => actionHandlers.onOpen(productBase.id)}
        aria-label={`Abrir ${productBase.name}`}
      >
        <span className='size-7 shrink-0' aria-hidden />

        <span className='size-7 shrink-0' aria-hidden />

        <Package className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' aria-hidden />

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='truncate font-medium text-emerald-950 dark:text-emerald-50'>
              {productBase.name}
            </span>
            <span className='shrink-0 text-xs text-muted-foreground'>{productBase.slug}</span>
          </div>
        </div>

        <Badge variant='outline' className='shrink-0 border-emerald-200 text-emerald-800'>
          {productBase.type}
        </Badge>

        <Badge variant={statusVariant(productBase.status)} className='shrink-0'>
          {productBase.status}
        </Badge>

        <ProductBaseActions
          productBase={productBase}
          onEdit={actionHandlers.onEdit}
          onDuplicate={actionHandlers.onDuplicate}
          onToggleStatus={actionHandlers.onToggleStatus}
          onDelete={actionHandlers.onDelete}
          disabled={disabled}
          isLoading={isLoading}
        />
      </button>
    </div>
  )
}
