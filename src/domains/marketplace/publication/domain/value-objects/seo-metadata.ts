export type SeoMetadata = {
  slug?: string
  metaTitle?: string
  metaDescription?: string
  ogImageUrl?: string
}

export function emptySeoMetadata(): SeoMetadata {
  return {}
}
