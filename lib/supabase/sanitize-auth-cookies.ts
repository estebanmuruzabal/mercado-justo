export type CookieLike = {
  name: string
  value: string
}

const CHUNK_SUFFIX_REGEX = /\.(0|[1-9][0-9]*)$/
const BASE64_PREFIX = 'base64-'

function looksLikeJwt(value: string): boolean {
  return value.split('.').length === 3
}

function isSupabaseAuthCookieName(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    lower.startsWith('sb-') ||
    (lower.includes('access') && lower.includes('token')) ||
    (lower.includes('refresh') && lower.includes('token'))
  )
}

function isChunkCookieName(name: string): boolean {
  return CHUNK_SUFFIX_REGEX.test(name)
}

function looksLikeSupabaseEncodedSession(value: string): boolean {
  if (!value) return false
  if (value.startsWith(BASE64_PREFIX)) return true
  if (value.startsWith('{') || value.startsWith('[')) return true
  // Chunk fragments and base64url blobs are longer opaque strings.
  return value.length > 40
}

function hasInvalidAccessTokenInSession(value: string): boolean {
  let raw = value
  if (raw.startsWith(BASE64_PREFIX)) {
    try {
      raw = Buffer.from(raw.slice(BASE64_PREFIX.length), 'base64url').toString('utf8')
    } catch {
      return false
    }
  }

  if (!raw.startsWith('{') && !raw.startsWith('[')) {
    return false
  }

  try {
    const parsed = JSON.parse(raw) as {
      access_token?: unknown
      currentSession?: { access_token?: unknown }
    }
    const accessToken =
      typeof parsed.access_token === 'string'
        ? parsed.access_token
        : typeof parsed.currentSession?.access_token === 'string'
          ? parsed.currentSession.access_token
          : null

    if (!accessToken) return false
    return !looksLikeJwt(accessToken)
  } catch {
    return false
  }
}

export function sanitizeSupabaseAuthCookies(cookies: CookieLike[]): {
  sanitized: CookieLike[]
  invalidCookieNames: string[]
} {
  const invalidCookieNames: string[] = []

  const sanitized = cookies.filter((c) => {
    if (!isSupabaseAuthCookieName(c.name)) return true
    if (!c.value) return true

    // Supabase SSR splits large sessions into `.0`, `.1`, ... chunks.
    if (isChunkCookieName(c.name)) return true

    if (looksLikeSupabaseEncodedSession(c.value)) {
      if (hasInvalidAccessTokenInSession(c.value)) {
        invalidCookieNames.push(c.name)
        return false
      }
      return true
    }

    // Plain short values (e.g. "undefined") are never valid session payloads.
    if (looksLikeJwt(c.value)) return true

    invalidCookieNames.push(c.name)
    return false
  })

  return { sanitized, invalidCookieNames }
}
