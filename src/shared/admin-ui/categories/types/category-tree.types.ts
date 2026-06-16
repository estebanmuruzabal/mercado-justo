import type { ProductBaseStatus, ProductBaseType } from '@/domains/marketplace/product-base/domain/product-base'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'

export type CategoryVisibilityStatus = 'visible' | 'hidden' | 'archived'

/** Filtro de tipo de listing en el panel admin. `all` muestra todos los tipos. */
export type ListingTypeFilter = 'all' | ListingType

export type CategoryTreeSource = {
  id: string
  name: string
  parentId: string | null
  listingType: ListingType
  isVisible: boolean
  /** Preparado para columna futura en Supabase. */
  isArchived?: boolean
  createdAt: string
}

export type ProductBaseTreeItem = {
  id: string
  name: string
  slug: string
  type: ProductBaseType
  status: ProductBaseStatus
  categoryId: string
  subcategoryId: string | null
  attributeCount: number
}

export type CategoryTreeNode = CategoryTreeSource & {
  visibilityStatus: CategoryVisibilityStatus
  depth: number
  /** Cantidad de subcategorías hijas directas. */
  childCount: number
  children: CategoryTreeNode[]
  /** Productos Base asociados a esta categoría (mostrados al final de la rama). */
  productBases: ProductBaseTreeItem[]
}

export type ProductBaseTreeActionHandlers = {
  onOpen: (productBaseId: string) => void
  onEdit: (productBaseId: string) => void
  onDuplicate: (productBaseId: string) => void
  onToggleStatus: (productBaseId: string, status: ProductBaseStatus) => void
  onDelete: (productBaseId: string) => void
}

export type CategoryTreeActionHandlers = {
  onEdit: (category: CategoryTreeSource) => void
  onCreateChild: (parent: CategoryTreeSource) => void
  onToggleVisibility: (category: CategoryTreeSource) => void
  onDelete: (category: CategoryTreeSource) => void
  onReparent: (categoryId: string, newParentId: string | null) => Promise<void>
}

export type CategoryTreeProps = {
  nodes: CategoryTreeNode[]
  searchQuery: string
  listingTypeFilter: ListingTypeFilter
  expandedIds: Set<string>
  onExpandedChange: (expandedIds: Set<string>) => void
  actionHandlers: CategoryTreeActionHandlers
  productBaseHandlers: ProductBaseTreeActionHandlers
  isReparenting?: boolean
  togglingVisibilityId?: string | null
  loadingProductBaseId?: string | null
}
