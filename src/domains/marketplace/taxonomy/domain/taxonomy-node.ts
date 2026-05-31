export type TaxonomyNode = {
  id: string
  parentId: string | null
  name: string
  slug: string
  allowedTypes: string[]
  isVisible: boolean
  sortOrder: number
  legacyCategoryId: string | null
}

export function taxonomyPathFromNames(names: string[]): string {
  return names.filter(Boolean).join(' / ')
}
