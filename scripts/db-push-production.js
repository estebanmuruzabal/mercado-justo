#!/usr/bin/env node

const { execSync } = require('child_process')
const { loadEnv } = require('./lib/load-env')
const {
  resolveProductionDbUrl,
  printProductionDbUrlHelp,
} = require('./lib/resolve-production-db-url')

loadEnv(['.env.production', '.env.production.local'])

async function main() {
  // Migrations prefer the direct host when available; pooler fallback for DNS/IPv6 issues.
  const dbUrl = await resolveProductionDbUrl({ preferPooler: true })

  if (!dbUrl) {
    printProductionDbUrlHelp()
    process.exit(1)
  }

  console.log('⚠  Pushing migrations to PRODUCTION database...')
  console.log('(Seed data is NOT included — schema migrations only.)')
  console.log('After first push, bootstrap catalog with: npm run db:seed:production\n')

  try {
    execSync(`supabase db push --db-url "${dbUrl}" --yes`, { stdio: 'inherit' })
    console.log('\n✓ Production migrations pushed successfully.')
  } catch {
    console.error('\n✗ Failed to push migrations to production.')
    console.error('If auth failed, reset/copy the DB password from the Dashboard')
    console.error('and update SUPABASE_DB_PASSWORD (or SUPABASE_PRODUCTION_DB_URL).')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
