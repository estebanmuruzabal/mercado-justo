#!/usr/bin/env node

/**
 * Validate environment configuration for the current APP_ENV.
 * Run before `dev`/`build` or in CI to catch missing/misconfigured vars early.
 *
 *   npm run env:check
 */

const { loadEnv } = require('./lib/load-env')

loadEnv()

const APP_ENV =
  process.env.NEXT_PUBLIC_APP_ENV ||
  (process.env.VERCEL_ENV === 'production'
    ? 'production'
    : process.env.VERCEL_ENV === 'preview'
      ? 'staging'
      : 'development')

const isProd = APP_ENV === 'production'
const isLocal = APP_ENV === 'development'

/** @type {{ key: string, required: boolean, check?: (v: string) => string | null }[]} */
const RULES = [
  { key: 'NEXT_PUBLIC_APP_ENV', required: true },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    check: (v) =>
      !isLocal && !v.startsWith('https://')
        ? 'must be HTTPS outside local development'
        : null,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    check: (v) => (/^https?:\/\//.test(v) ? null : 'must be a valid URL'),
  },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  // Telegram is optional, but if any var is present, all must be.
  { key: 'TELEGRAM_BOT_TOKEN', required: false, group: 'telegram' },
  { key: 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', required: false, group: 'telegram' },
  {
    key: 'TELEGRAM_WEBHOOK_SECRET',
    required: false,
    group: 'telegram',
    check: (v) => (isProd && v.length < 16 ? 'use a longer random secret in production' : null),
  },
]

const telegramKeys = RULES.filter((r) => r.group === 'telegram').map((r) => r.key)
const telegramEnabled = telegramKeys.some((k) => process.env[k])

let errors = 0
let warnings = 0

console.log(`\nEnvironment check — APP_ENV=${APP_ENV}\n${'─'.repeat(40)}`)

for (const rule of RULES) {
  const value = process.env[rule.key]
  const required = rule.required || (rule.group === 'telegram' && telegramEnabled)

  if (!value) {
    if (required) {
      console.log(`✗ ${rule.key}  (missing, required)`)
      errors++
    } else {
      console.log(`· ${rule.key}  (optional, not set)`)
    }
    continue
  }

  const problem = rule.check ? rule.check(value) : null
  if (problem) {
    // Format issues are errors; the production-secret-length one is a warning.
    if (rule.key === 'TELEGRAM_WEBHOOK_SECRET') {
      console.log(`⚠ ${rule.key}  (${problem})`)
      warnings++
    } else {
      console.log(`✗ ${rule.key}  (${problem})`)
      errors++
    }
    continue
  }

  console.log(`✓ ${rule.key}`)
}

console.log('─'.repeat(40))

if (errors > 0) {
  console.error(`\n${errors} error(s) found. Fix them in .env.local (or your Vercel env).\n`)
  process.exit(1)
}

console.log(`\nAll good${warnings ? ` (${warnings} warning(s))` : ''}. ✓\n`)
