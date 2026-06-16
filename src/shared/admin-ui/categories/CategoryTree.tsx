'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Folder, Search } from 'lucide-react'

import { CategoryTreeNode } from '@/shared/admin-ui/categories/CategoryTreeNode'
import type {
  CategoryTreeNode as CategoryTreeNodeType,
  CategoryTreeProps,
} from '@/shared/admin-ui/categories/types/category-tree.types'
import { filterTreeBySearch } from '@/shared/admin-ui/categories/utils/category-tree.utils'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils/utils'

function RootDropZone({
  activeDragId,
  disabled,
}: {
  activeDragId: string | null
  disabled?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: '__root__',
    disabled: disabled || !activeDragId,
  })

  if (!activeDragId) return null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-3 mb-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground',
        isOver && 'border-primary bg-primary/5 text-primary',
      )}
    >
      Soltá aquí para convertir en categoría raíz
    </div>
  )
}

function findNodeById(nodes: CategoryTreeNodeType[], id: string): CategoryTreeNodeType | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNodeById(node.children, id)
    if (found) return found
  }
  return null
}

export function CategoryTree({
  nodes,
  searchQuery,
  expandedIds,
  onExpandedChange,
  actionHandlers,
  productBaseHandlers,
  isReparenting = false,
  togglingVisibilityId = null,
  loadingProductBaseId = null,
}: Omit<CategoryTreeProps, 'listingTypeFilter'>) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const { tree: visibleTree, autoExpandIds } = useMemo(
    () => filterTreeBySearch(nodes, searchQuery),
    [nodes, searchQuery],
  )

  const effectiveExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return expandedIds
    return new Set([...expandedIds, ...autoExpandIds])
  }, [autoExpandIds, expandedIds, searchQuery])

  const activeNode = activeDragId ? findNodeById(nodes, activeDragId) : null

  function handleToggleExpand(id: string) {
    const next = new Set(expandedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onExpandedChange(next)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const draggedId = String(event.active.id)
    const dropTargetId = event.over ? String(event.over.id) : null

    setActiveDragId(null)
    setOverId(null)

    if (!dropTargetId) return

    const newParentId = dropTargetId === '__root__' ? null : dropTargetId
    if (newParentId === draggedId) return

    void actionHandlers.onReparent(draggedId, newParentId)
  }

  if (visibleTree.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
        <Search className='size-8 text-muted-foreground/60' />
        <p className='font-medium'>Sin resultados</p>
        <p className='text-sm text-muted-foreground'>
          {searchQuery.trim()
            ? 'Probá con otro término de búsqueda o cambiá el filtro de tipo.'
            : 'No hay categorías para este tipo de listing.'}
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={(event) => setOverId(event.over ? String(event.over.id) : null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragId(null)
        setOverId(null)
      }}
    >
      <div
        role='tree'
        aria-label='Árbol de categorías'
        className={cn(isReparenting && 'pointer-events-none opacity-60')}
      >
        <RootDropZone activeDragId={activeDragId} disabled={isReparenting} />

        {visibleTree.map((node) => (
          <CategoryTreeNode
            key={node.id}
            node={node}
            isExpanded={effectiveExpandedIds.has(node.id)}
            onToggleExpand={handleToggleExpand}
            expandedIds={effectiveExpandedIds}
            onExpandedChange={onExpandedChange}
            actionHandlers={actionHandlers}
            productBaseHandlers={productBaseHandlers}
            activeDragId={activeDragId}
            overId={overId}
            disabled={isReparenting}
            togglingVisibilityId={togglingVisibilityId}
            loadingProductBaseId={loadingProductBaseId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeNode ? (
          <div className='flex items-center gap-2 rounded-md border bg-background px-4 py-2 shadow-lg'>
            <Folder className='size-4 text-sky-600' />
            <span className='font-medium'>{activeNode.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export function CategoryTreeSearch({
  value,
  onChange,
  placeholder = 'Buscar categoría o producto base…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className='relative'>
      <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className='pl-9'
        autoComplete='off'
      />
    </div>
  )
}
