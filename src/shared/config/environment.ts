/**
 * Single source of truth for environment identity and the public site URL.
 *
 * CLIENT-SAFE: this module only reads `NEXT_PUBLIC_*` vars (inlined by Next on
 * the client) plus Vercel system vars (server-only). It contains NO secrets and
 * can be imported from both Server and Client Components.
 *
 * Environment model:
 *   development → local machine (`supabase start`, optional ngrok/cloudflared)
 *   staging     → Vercel Preview deployments (isolated Supabase + dev bot)
 *   production  → Vercel Production deployment (real Supabase + real bot)
 */

export type AppEnv = 'development' | 'staging' | 'production'

function resolveAppEnv(): AppEnv {
  // 1) Explicit override (recommended on Vercel so the client also knows the env).
  const explicit = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase()
  if (explicit === 'development' || explicit === 'staging' || explicit === 'production') {
    return explicit
  }

  // 2) Derive from Vercel system env (server-side only).
  //    production → production, preview → staging, development → development.
  switch (process.env.VERCEL_ENV) {
    case 'production':
      return 'production'
    case 'preview':
      return 'staging'
    case 'development':
      return 'development'
  }

  // 3) Last resort: Node env.
  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

export const APP_ENV: AppEnv = resolveAppEnv()

export const isProduction = APP_ENV === 'production'
export const isStaging = APP_ENV === 'staging'
export const isDevelopment = APP_ENV === 'development'

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/**
 * Absolute base URL of the app, without trailing slash. Resolution order:
 *   1) NEXT_PUBLIC_SITE_URL  (explicit; works on client + server)
 *   2) https://$VERCEL_URL   (Vercel auto-assigned, server-side; great for previews)
 *   3) http://localhost:3000 (local fallback)
 *
 * Always use this instead of hardcoding URLs.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return stripTrailingSlash(explicit)

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${stripTrailingSlash(vercelUrl)}`

  return 'http://localhost:3000'
}

/** Build an absolute URL for a path using {@link getSiteUrl}. */
export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** True when the site is served over HTTPS (required by some integrations, e.g. Telegram url buttons). */
export function isHttpsSiteUrl(): boolean {
  return getSiteUrl().startsWith('https://')
}

/**
 * Short, human-readable prefix to tag outbound content (e.g. Telegram messages)
 * in non-production environments so real users/notifications are never confused
 * with staging/dev. Empty string in production.
 */
export function getEnvironmentBadge(): string {
  if (isProduction) return ''
  return isStaging ? '🧪 [STAGING] ' : '🛠️ [DEV] '
}
