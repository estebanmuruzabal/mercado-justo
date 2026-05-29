function looksLikeJwt(value: string): boolean {
  return value.split('.').length === 3
}

function isPlaceholderKey(value: string): boolean {
  const lower = value.toLowerCase()
  return lower === 'your-anon-key' || lower === 'your-service-role-key'
}

/** Supabase URL (prefers .env.local override when Next loads env). */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  return url
}

/**
 * Resolves the public Supabase key.
 * Supports legacy JWT anon keys and newer publishable keys (`sb_publishable_...`).
 */
export function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (anonKey && !isPlaceholderKey(anonKey) && (looksLikeJwt(anonKey) || anonKey.startsWith('sb_publishable_'))) {
    return anonKey
  }

  if (publishableKey) {
    return publishableKey
  }

  if (anonKey && !isPlaceholderKey(anonKey)) {
    return anonKey
  }

  throw new Error(
    'Missing Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  )
}

export function hasSupabasePublicConfig(): boolean {
  try {
    getSupabaseUrl()
    getSupabaseAnonKey()
    return true
  } catch {
    return false
  }
}
