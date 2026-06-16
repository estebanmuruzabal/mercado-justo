'use client'

import { Eye, EyeOff, Loader2, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import type { CategoryTreeSource } from '@/shared/admin-ui/categories/types/category-tree.types'

type CategoryActionsProps = {
  category: CategoryTreeSource
  onEdit: (category: CategoryTreeSource) => void
  onCreateChild: (parent: CategoryTreeSource) => void
  onToggleVisibility: (category: CategoryTreeSource) => void
  onDelete: (category: CategoryTreeSource) => void
  disabled?: boolean
  isTogglingVisibility?: boolean
}

export function CategoryActions({
  category,
  onEdit,
  onCreateChild,
  onToggleVisibility,
  onDelete,
  disabled = false,
  isTogglingVisibility = false,
}: CategoryActionsProps) {
  const isArchived = category.isArchived === true
  const visibilityLabel = category.isVisible ? 'Ocultar' : 'Mostrar'

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
              disabled={disabled}
              onClick={() => onEdit(category)}
              aria-label={`Editar ${category.name}`}
            >
              <PencilLine className='size-4' />
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
              disabled={disabled || isArchived}
              onClick={() => onCreateChild(category)}
              aria-label={`Crear subcategoría de ${category.name}`}
            >
              <Plus className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Crear hijo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8'
              disabled={disabled || isArchived || isTogglingVisibility}
              onClick={() => onToggleVisibility(category)}
              aria-label={`${visibilityLabel} ${category.name}`}
            >
              {isTogglingVisibility ? (
                <Loader2 className='size-4 animate-spin' />
              ) : category.isVisible ? (
                <EyeOff className='size-4' />
              ) : (
                <Eye className='size-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{visibilityLabel}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8 text-destructive hover:text-destructive'
              disabled={disabled}
              onClick={() => onDelete(category)}
              aria-label={`Eliminar ${category.name}`}
            >
              <Trash2 className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eliminar</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
