'use client'

import { Copy, Loader2, PencilLine, Power, Trash2 } from 'lucide-react'

import type { ProductBaseTreeItem } from '@/shared/admin-ui/categories/types/category-tree.types'
import type { ProductBaseStatus } from '@/domains/marketplace/product-base/domain/product-base'
import { Button } from '@/shared/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'

type ProductBaseActionsProps = {
  productBase: ProductBaseTreeItem
  onEdit: (productBaseId: string) => void
  onDuplicate: (productBaseId: string) => void
  onToggleStatus: (productBaseId: string, status: ProductBaseStatus) => void
  onDelete: (productBaseId: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function ProductBaseActions({
  productBase,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  disabled = false,
  isLoading = false,
}: ProductBaseActionsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className='flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8'
              disabled={disabled || isLoading}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(productBase.id)
              }}
              aria-label={`Editar ${productBase.name}`}
            >
              {isLoading ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <PencilLine className='size-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8'
              disabled={disabled || isLoading}
              onClick={(event) => {
                event.stopPropagation()
                onDuplicate(productBase.id)
              }}
              aria-label={`Duplicar ${productBase.name}`}
            >
              <Copy className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>

        {productBase.status !== 'ACTIVE' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8'
                disabled={disabled || isLoading}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleStatus(productBase.id, 'ACTIVE')
                }}
                aria-label={`Activar ${productBase.name}`}
              >
                <Power className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activar</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8'
                disabled={disabled || isLoading}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleStatus(productBase.id, 'INACTIVE')
                }}
                aria-label={`Desactivar ${productBase.name}`}
              >
                <Power className='size-4 text-muted-foreground' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desactivar</TooltipContent>
          </Tooltip>
        )}

        {productBase.status !== 'ACTIVE' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8 text-destructive hover:text-destructive'
                disabled={disabled || isLoading}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(productBase.id)
                }}
                aria-label={`Eliminar ${productBase.name}`}
              >
                <Trash2 className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8 text-destructive/40'
                  disabled
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Desactivá ${productBase.name} antes de eliminar`}
                >
                  <Trash2 className='size-4' />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Desactivá antes de eliminar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
