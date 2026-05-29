import { z } from 'zod'

/**
 * Validated environment variables (SERVER-side).
 *
 * Import this ONLY from server code (Server Components, Server Actions, Route
 * Handlers, services). It includes secrets and is validated once at module load
 * so misconfiguration fails fast with a clear message.
 *
 * For environment identity / public site URL (client-safe), use
 * `@/lib/config/environment` instead.
 */
const envSchema = z
  .object({
    // ── Environment identity ──
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).optional(),

    // ── Public site URL (used for absolute links, OAuth redirects, Telegram, etc.) ──
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

    // ── Supabase ──
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    // Either the legacy anon JWT or the newer publishable key is accepted (see refine).
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    // Service-role key: required for privileged server operations (webhooks, admin tasks).
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

    // ── Telegram bot integration (per-environment bot) ──
    // Optional so the app builds without it; callers throw a clear error when missing.
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
  })
  .refine(
    (env) => Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    {
      message:
        'Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      path: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    },
  )

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

/**
 * Assert that the secrets required for privileged/server-side operations are
 * present. Call from code paths that genuinely need them (e.g. the Telegram
 * webhook) rather than failing the whole app at boot.
 */
export function assertServiceRoleKey(): string {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for this operation.')
  }
  return env.SUPABASE_SERVICE_ROLE_KEY
}
