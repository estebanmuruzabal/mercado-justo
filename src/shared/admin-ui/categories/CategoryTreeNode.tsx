'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  GripVertical,
} from 'lucide-react'

import { CategoryActions } from '@/shared/admin-ui/categories/CategoryActions'
import { ProductBaseTreeRow } from '@/shared/admin-ui/categories/ProductBaseTreeRow'
import type {
  CategoryTreeActionHandlers,
  CategoryTreeNode,
  CategoryVisibilityStatus,
  ProductBaseTreeActionHandlers,
} from '@/shared/admin-ui/categories/types/category-tree.types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/utils'

const INDENT_PX = 20

type CategoryTreeNodeProps = {
  node: CategoryTreeNode
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  expandedIds: Set<string>
  onExpandedChange: (expandedIds: Set<string>) => void
  actionHandlers: CategoryTreeActionHandlers
  productBaseHandlers: ProductBaseTreeActionHandlers
  activeDragId: string | null
  overId: string | null
  disabled?: boolean
  togglingVisibilityId?: string | null
  loadingProductBaseId?: string | null
}

function VisibilityBadge({ status }: { status: CategoryVisibilityStatus }) {
  if (status === 'archived') {
    return (
      <Badge variant='outline' className='gap-1 border-amber-300 bg-amber-50 text-amber-900'>
        <Archive className='size-3.5' />
        Archivada
      </Badge>
    )
  }

  if (status === 'hidden') {
    return (
      <Badge variant='secondary' className='gap-1'>
        <EyeOff className='size-3.5' />
        Oculta
      </Badge>
    )
  }

  return (
    <Badge variant='default' className='gap-1'>
      <Eye className='size-3.5' />
      Visible
    </Badge>
  )
}

export function CategoryTreeNode({
  node,
  isExpanded,
  onToggleExpand,
  expandedIds,
  onExpandedChange,
  actionHandlers,
  productBaseHandlers,
  activeDragId,
  overId,
  disabled = false,
  togglingVisibilityId = null,
  loadingProductBaseId = null,
}: CategoryTreeNodeProps) {
  const hasSubcategories = node.childCount > 0
  const hasProductBases = node.productBases.length > 0
  const isExpandable = hasSubcategories || hasProductBases
  const isDropTarget = overId === node.id && activeDragId !== node.id

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: isDraggingSelf,
  } = useDraggable({
    id: node.id,
    disabled,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    disabled: disabled || activeDragId === node.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div role='treeitem' aria-expanded={isExpandable ? isExpanded : undefined}>
      <div
        ref={(element) => {
          setDragRef(element)
          setDropRef(element)
        }}
        style={{
          ...style,
          paddingLeft: `${node.depth * INDENT_PX + 8}px`,
        }}
        className={cn(
          'group flex items-center gap-2 border-b px-3 py-2.5 transition-colors',
          isDraggingSelf && 'z-10 opacity-60',
          (isDropTarget || isOver) && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
        )}
      >
        <button
          type='button'
          className={cn(
            'flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground',
            'hover:bg-muted active:cursor-grabbing',
            disabled && 'pointer-events-none opacity-40',
          )}
          aria-label={`Arrastrar ${node.name}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className='size-4' />
        </button>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn('size-7 shrink-0', !isExpandable && 'invisible')}
          disabled={!isExpandable}
          onClick={() => onToggleExpand(node.id)}
          aria-label={isExpanded ? `Contraer ${node.name}` : `Expandir ${node.name}`}
        >
          {isExpanded ? (
            <ChevronDown className='size-4' />
          ) : (
            <ChevronRight className='size-4' />
          )}
        </Button>

        <Folder className='size-4 shrink-0 text-sky-600 dark:text-sky-400' aria-hidden />

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='truncate font-medium text-foreground'>{node.name}</span>
            {hasSubcategories ? (
              <span className='shrink-0 text-xs text-muted-foreground'>
                {node.childCount} {node.childCount === 1 ? 'hijo' : 'hijos'}
              </span>
            ) : null}
            {hasProductBases ? (
              <span className='shrink-0 text-xs text-emerald-700 dark:text-emerald-300'>
                {node.productBases.length}{' '}
                {node.productBases.length === 1 ? 'producto base' : 'productos base'}
              </span>
            ) : null}
          </div>
        </div>

        <VisibilityBadge status={node.visibilityStatus} />

        <CategoryActions
          category={node}
          onEdit={actionHandlers.onEdit}
          onCreateChild={actionHandlers.onCreateChild}
          onToggleVisibility={actionHandlers.onToggleVisibility}
          onDelete={actionHandlers.onDelete}
          disabled={disabled}
          isTogglingVisibility={togglingVisibilityId === node.id}
        />
      </div>

      {isExpanded ? (
        <div role='group'>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              isExpanded={expandedIds.has(child.id)}
              onToggleExpand={onToggleExpand}
              expandedIds={expandedIds}
              onExpandedChange={onExpandedChange}
              actionHandlers={actionHandlers}
              productBaseHandlers={productBaseHandlers}
              activeDragId={activeDragId}
              overId={overId}
              disabled={disabled}
              togglingVisibilityId={togglingVisibilityId}
              loadingProductBaseId={loadingProductBaseId}
            />
          ))}

          {node.productBases.map((productBase) => (
            <ProductBaseTreeRow
              key={productBase.id}
              productBase={productBase}
              depth={node.depth + 1}
              actionHandlers={productBaseHandlers}
              disabled={disabled}
              isLoading={loadingProductBaseId === productBase.id}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
