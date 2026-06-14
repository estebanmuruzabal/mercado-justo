#!/usr/bin/env node

const { execSync } = require('child_process')

function run(command) {
  console.log(`\n→ ${command}`)
  execSync(command, { stdio: 'inherit' })
}

function isSupabaseRunning() {
  try {
    execSync('supabase status', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function main() {
  if (!isSupabaseRunning()) {
    console.error('Error: Supabase local is not running.')
    console.error('Start it with: npm run db:start')
    process.exit(1)
  }

  console.log('Setting up local database (reset + migrations + seed + types)...')

  let resetFailed = false

  try {
    run('supabase db reset')
  } catch {
    resetFailed = true
    console.warn(
      '\n⚠ supabase db reset reported an error (often a transient storage health check).',
    )
    console.warn('  Continuing with type generation if migrations and seed were applied...')
  }

  try {
    run('npm run db:types')
    console.log('\n✓ Database setup complete. Demo credentials:')
    console.log('  Super Admin: admin@test.com / 123456')
    console.log('  Compradores: buyer1@test.com … buyer3@test.com / 123456')
    console.log('  Vendedores:  vendor1@test.com … vendor4@test.com / 123456')
    if (resetFailed) {
      console.warn('\n  Note: reset finished with warnings — verify data with: npm run db:seed')
    }
  } catch {
    console.error('\n✗ Database setup failed.')
    process.exit(1)
  }
}

main()
