#!/usr/bin/env node

/**
 * Shared helpers for production Supabase DB URL resolution.
 * Prefer explicit SUPABASE_PRODUCTION_DB_URL; otherwise derive from
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD.
 */

const dns = require('dns').promises

function projectRefFromPublicUrl(publicUrl) {
  try {
    const host = new URL(publicUrl).hostname
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/**
 * @param {{ preferPooler?: boolean }} [options]
 * @returns {Promise<string|null>}
 */
async function resolveProductionDbUrl(options = {}) {
  const { preferPooler = true } = options

  if (process.env.SUPABASE_PRODUCTION_DB_URL) {
    return process.env.SUPABASE_PRODUCTION_DB_URL
  }

  const password = process.env.SUPABASE_DB_PASSWORD
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!password || !publicUrl) return null

  const projectRef = projectRefFromPublicUrl(publicUrl)
  if (!projectRef) return null

  const encoded = encodeURIComponent(password)
  const direct = `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`
  const pooler = `postgresql://postgres.${projectRef}:${encoded}@aws-1-us-east-2.pooler.supabase.com:5432/postgres`

  if (!preferPooler) return direct

  try {
    await dns.lookup('aws-1-us-east-2.pooler.supabase.com')
    return pooler
  } catch {
    return direct
  }
}

function printProductionDbUrlHelp() {
  console.error('Error: production database URL could not be resolved.')
  console.error('')
  console.error('Option A — set an explicit URL in .env.production.local:')
  console.error(
    '  SUPABASE_PRODUCTION_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres',
  )
  console.error('')
  console.error('Option B — in .env.production set both:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co')
  console.error('  SUPABASE_DB_PASSWORD=[database password from Supabase Dashboard]')
  console.error('')
  console.error('Dashboard → Project Settings → Database → Database password')
}

module.exports = {
  projectRefFromPublicUrl,
  resolveProductionDbUrl,
  printProductionDbUrlHelp,
}
