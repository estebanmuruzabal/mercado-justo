#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

const SEED_FILE = path.join('supabase', 'seed.sql')
const DEFAULT_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function isSupabaseRunning() {
  try {
    execSync('supabase status', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function runSeed() {
  const dbUrl = process.env.SUPABASE_LOCAL_DB_URL || DEFAULT_DB_URL
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f ${SEED_FILE}`, {
    stdio: 'inherit',
  })
}

function main() {
  if (!isSupabaseRunning()) {
    console.error('Error: Supabase local is not running.')
    console.error('Start it with: npm run db:start')
    process.exit(1)
  }

  console.log('Seeding local database from', SEED_FILE, '...')
  try {
    runSeed()
    console.log('✓ Seed completed successfully.')
  } catch {
    console.error('✗ Seed failed.')
    process.exit(1)
  }
}

main()
