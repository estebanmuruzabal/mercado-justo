'use client'

import { FolderPlus, PackagePlus, Plus } from 'lucide-react'

import type { CategoryTreeSource } from '@/shared/admin-ui/categories/types/category-tree.types'
import { Button } from '@/shared/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { cn } from '@/shared/utils/utils'

const INDENT_PX = 20

type CategoryTreeQuickAddProps = {
  category: CategoryTreeSource
  onCreateChild: (parent: CategoryTreeSource) => void
  onCreateProductBase: (category: CategoryTreeSource) => void
  disabled?: boolean
  variant?: 'inline' | 'footer'
  depth?: number
}

export function CategoryTreeQuickAdd({
  category,
  onCreateChild,
  onCreateProductBase,
  disabled = false,
  variant = 'inline',
  depth = 0,
}: CategoryTreeQuickAddProps) {
  if (variant === 'footer') {
    return (
      <div
        className='flex flex-col gap-0.5 border-b bg-muted/20 py-1 sm:flex-row sm:items-center sm:gap-2'
        style={{ paddingLeft: `${depth * INDENT_PX + 8}px` }}
      >
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 justify-start gap-2 text-muted-foreground hover:text-foreground'
          disabled={disabled || category.isArchived === true}
          onClick={() => onCreateChild(category)}
        >
          <FolderPlus className='size-4 shrink-0 text-sky-600' />
          Agregar subcategoría
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 justify-start gap-2 text-muted-foreground hover:text-emerald-800 dark:hover:text-emerald-200'
          disabled={disabled}
          onClick={() => onCreateProductBase(category)}
        >
          <PackagePlus className='size-4 shrink-0 text-emerald-600' />
          Agregar producto base
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className='flex shrink-0 items-center gap-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className={cn(
                'h-7 gap-1 px-2 text-xs',
                disabled || category.isArchived === true ? 'opacity-50' : '',
              )}
              disabled={disabled || category.isArchived === true}
              onClick={(event) => {
                event.stopPropagation()
                onCreateChild(category)
              }}
              aria-label={`Agregar subcategoría en ${category.name}`}
            >
              <Plus className='size-3.5' />
              <span className='hidden lg:inline'>Subcategoría</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Agregar subcategoría</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-7 gap-1 border-emerald-200 px-2 text-xs text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/40'
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                onCreateProductBase(category)
              }}
              aria-label={`Agregar producto base en ${category.name}`}
            >
              <Plus className='size-3.5' />
              <span className='hidden lg:inline'>Producto base</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Agregar producto base</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
