import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import type { ProductBaseSummaryDto } from '@/domains/marketplace/product-base/application/dto/product-base.dto'
import type {
  CategoryTreeNode,
  CategoryTreeSource,
  CategoryVisibilityStatus,
  ListingTypeFilter,
  ProductBaseTreeItem,
} from '@/shared/admin-ui/categories/types/category-tree.types'

export const ADMIN_CATEGORY_LISTING_TYPES = ['product', 'service', 'property'] as const

export type AdminCategoryListingType = (typeof ADMIN_CATEGORY_LISTING_TYPES)[number]

const LOCALE = 'es'

export function getVisibilityStatus(
  source: Pick<CategoryTreeSource, 'isVisible' | 'isArchived'>,
): CategoryVisibilityStatus {
  if (source.isArchived) return 'archived'
  return source.isVisible ? 'visible' : 'hidden'
}

export function adminRowToTreeSource(row: AdminCategoryRow): CategoryTreeSource {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    listingType: row.listingType,
    isVisible: row.isVisible,
    createdAt: row.createdAt,
  }
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, LOCALE, { sensitivity: 'base' }))
}

export function filterSourcesByListingType(
  sources: CategoryTreeSource[],
  listingTypeFilter: ListingTypeFilter,
): CategoryTreeSource[] {
  if (listingTypeFilter === 'all') return sources
  return sources.filter((item) => item.listingType === listingTypeFilter)
}

export function buildCategoryTree(
  sources: CategoryTreeSource[],
  listingTypeFilter: ListingTypeFilter = 'all',
): CategoryTreeNode[] {
  const filtered = filterSourcesByListingType(sources, listingTypeFilter)

  const byParent = new Map<string | null, CategoryTreeSource[]>()
  for (const source of filtered) {
    const key = source.parentId
    const siblings = byParent.get(key) ?? []
    siblings.push(source)
    byParent.set(key, siblings)
  }

  function buildBranch(parentId: string | null, depth: number): CategoryTreeNode[] {
    const siblings = sortByName(byParent.get(parentId) ?? [])

    return siblings.map((source) => {
      const children = buildBranch(source.id, depth + 1)
      return {
        ...source,
        visibilityStatus: getVisibilityStatus(source),
        depth,
        childCount: children.length,
        children,
        productBases: [],
      }
    })
  }

  return buildBranch(null, 0)
}

export function resolveProductBaseCategoryId(productBase: Pick<ProductBaseSummaryDto, 'categoryId' | 'subcategoryId'>) {
  return productBase.subcategoryId ?? productBase.categoryId
}

export function toProductBaseTreeItem(row: ProductBaseSummaryDto): ProductBaseTreeItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    status: row.status,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    attributeCount: row.attributeCount,
  }
}

export function indexProductBasesByCategory(
  productBases: ProductBaseSummaryDto[],
): Map<string, ProductBaseTreeItem[]> {
  const map = new Map<string, ProductBaseTreeItem[]>()

  for (const row of productBases) {
    const categoryId = resolveProductBaseCategoryId(row)
    const current = map.get(categoryId) ?? []
    current.push(toProductBaseTreeItem(row))
    map.set(categoryId, current)
  }

  for (const [categoryId, items] of map) {
    map.set(categoryId, sortByName(items))
  }

  return map
}

export function attachProductBasesToTree(
  nodes: CategoryTreeNode[],
  productBasesByCategoryId: Map<string, ProductBaseTreeItem[]>,
): CategoryTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    productBases: productBasesByCategoryId.get(node.id) ?? [],
    children: attachProductBasesToTree(node.children, productBasesByCategoryId),
  }))
}

export function buildCategoryTreeWithProductBases(
  sources: CategoryTreeSource[],
  productBases: ProductBaseSummaryDto[],
  listingTypeFilter: ListingTypeFilter = 'all',
): CategoryTreeNode[] {
  const tree = buildCategoryTree(sources, listingTypeFilter)
  const indexed = indexProductBasesByCategory(productBases)
  return attachProductBasesToTree(tree, indexed)
}

export function collectNodeIds(nodes: CategoryTreeNode[]): string[] {
  const ids: string[] = []
  const walk = (items: CategoryTreeNode[]) => {
    for (const node of items) {
      ids.push(node.id)
      walk(node.children)
    }
  }
  walk(nodes)
  return ids
}

export function filterTreeBySearch(
  nodes: CategoryTreeNode[],
  query: string,
): { tree: CategoryTreeNode[]; autoExpandIds: Set<string> } {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return { tree: nodes, autoExpandIds: new Set() }
  }

  const autoExpandIds = new Set<string>()

  function filterBranch(branch: CategoryTreeNode[]): CategoryTreeNode[] {
    const result: CategoryTreeNode[] = []

    for (const node of branch) {
      const filteredChildren = filterBranch(node.children)
      const categoryMatches = node.name.toLowerCase().includes(normalized)
      const matchingProductBases = node.productBases.filter(
        (productBase) =>
          productBase.name.toLowerCase().includes(normalized) ||
          productBase.slug.toLowerCase().includes(normalized),
      )
      const hasMatchingChildren = filteredChildren.length > 0
      const hasMatchingProductBases = matchingProductBases.length > 0

      if (categoryMatches || hasMatchingChildren || hasMatchingProductBases) {
        if (hasMatchingChildren || hasMatchingProductBases) {
          autoExpandIds.add(node.id)
        }
        result.push({
          ...node,
          children: categoryMatches ? node.children : filteredChildren,
          childCount: categoryMatches ? node.childCount : filteredChildren.length,
          productBases: categoryMatches ? node.productBases : matchingProductBases,
        })
      }
    }

    return result
  }

  return { tree: filterBranch(nodes), autoExpandIds }
}

export function isDescendantOf(
  sources: CategoryTreeSource[],
  candidateId: string,
  ancestorId: string,
): boolean {
  const byId = new Map(sources.map((item) => [item.id, item]))
  let cursor: string | null = candidateId

  while (cursor) {
    if (cursor === ancestorId) return true
    cursor = byId.get(cursor)?.parentId ?? null
  }

  return false
}

export function countCategoriesByListingType(
  sources: CategoryTreeSource[],
): Record<AdminCategoryListingType, number> {
  const counts = {
    product: 0,
    service: 0,
    property: 0,
  } satisfies Record<AdminCategoryListingType, number>

  for (const source of sources) {
    if (source.listingType in counts) {
      counts[source.listingType as AdminCategoryListingType] += 1
    }
  }

  return counts
}
