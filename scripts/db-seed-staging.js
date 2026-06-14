#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')
const { loadEnv } = require('./lib/load-env')

loadEnv(['.env.staging.local'])

const SEED_FILES = [
  path.join('supabase', 'seeds', 'seed.shared.sql'),
  path.join('supabase', 'seeds', 'seed.staging.sql'),
]

const DEFAULT_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function main() {
  const dbUrl = process.env.SUPABASE_STAGING_DB_URL || process.env.SUPABASE_LOCAL_DB_URL || DEFAULT_DB_URL
  const isRemote = Boolean(process.env.SUPABASE_STAGING_DB_URL)

  console.log(`Seeding ${isRemote ? 'staging' : 'local'} database (shared + staging demo)...`)
  try {
    for (const file of SEED_FILES) {
      console.log(`  → ${file}`)
      execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f ${file}`, { stdio: 'inherit' })
    }
    console.log('✓ Staging seed completed successfully.')
  } catch {
    console.error('✗ Staging seed failed.')
    process.exit(1)
  }
}

main()
