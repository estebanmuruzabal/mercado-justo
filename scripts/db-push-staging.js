#!/usr/bin/env node

const { execSync } = require('child_process')
const { loadEnv } = require('./lib/load-env')

loadEnv(['.env.staging.local'])

const dbUrl = process.env.SUPABASE_STAGING_DB_URL

function main() {
  if (!dbUrl) {
    console.error('Error: SUPABASE_STAGING_DB_URL is not set.')
    console.error('')
    console.error('Create .env.staging.local with:')
    console.error('  SUPABASE_STAGING_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres')
    console.error('')
    console.error('See .env.staging.example for reference.')
    process.exit(1)
  }

  console.log('Pushing migrations to staging database...')
  console.log('(Seed data is NOT included — schema migrations only.)\n')

  try {
    execSync(`supabase db push --db-url "${dbUrl}" --yes`, { stdio: 'inherit' })
    console.log('\n✓ Staging migrations pushed successfully.')
  } catch {
    console.error('\n✗ Failed to push migrations to staging.')
    process.exit(1)
  }
}

main()
