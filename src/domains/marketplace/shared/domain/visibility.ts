export const VISIBILITY_LEVELS = ['public', 'unlisted', 'private', 'followers_only'] as const

export type Visibility = (typeof VISIBILITY_LEVELS)[number]

export function isPubliclyDiscoverable(visibility: Visibility, lifecycle: string): boolean {
  return visibility === 'public' && lifecycle === 'published'
}
