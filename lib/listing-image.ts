export const LISTING_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'

export function listingImageSrc(src: string | null | undefined): string {
  if (!src?.trim()) return LISTING_FALLBACK_IMAGE
  return src
}

export function isConfiguredRemoteImage(src: string): boolean {
  try {
    const { hostname, protocol } = new URL(src)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    if (hostname === 'images.unsplash.com') return true
    if (hostname.endsWith('.supabase.co')) return true
    if (hostname.endsWith('.googleusercontent.com')) return true
    if (hostname === 'avatars.githubusercontent.com') return true
    if (hostname === '127.0.0.1' || hostname === 'localhost') return true
    return false
  } catch {
    return false
  }
}
