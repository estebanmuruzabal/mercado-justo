#!/usr/bin/env node

/**
 * Production E2E bootstrap — idempotent.
 *
 * 1) seed.shared.sql (seed_upsert_category helper)
 * 2) taxonomy-alimentos catalog (categories + product_base)
 * 3) bootstrap users (admin / vendor / buyer) — BOOTSTRAP_* or dev defaults
 * 4) seed.production.sql (store + published listings + variants)
 *
 * Safe to re-run. Not wired to CI/CD — run manually after migrations.
 */

const { execSync } = require('child_process')
const path = require('path')
const { Client } = require('pg')
const { loadEnv } = require('./lib/load-env')
const {
  resolveProductionDbUrl,
  printProductionDbUrlHelp,
} = require('./lib/resolve-production-db-url')
const { upsertBootstrapUsers } = require('./lib/upsert-bootstrap-users')

loadEnv(['.env.production', '.env.production.local'])

const SEED_SHARED = path.join('supabase', 'seeds', 'seed.shared.sql')
const SEED_PRODUCTION = path.join('supabase', 'seeds', 'seed.production.sql')

async function verify(dbUrl) {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    const { rows: users } = await client.query(
      `select u.id, u.email, u.role, u.full_name, u.status,
              exists(select 1 from public.store s where s.id = u.id) as owns_store
       from public."user" u
       where u.id in (
         '10000000-0000-4000-8000-000000000001',
         '10000000-0000-4000-8000-000000000011',
         '10000000-0000-4000-8000-000000000021'
       )
       order by u.role, u.email`,
    )

    const { rows: stores } = await client.query(
      `select id, name, slug, status, product_limit
       from public.store
       where id = '10000000-0000-4000-8000-000000000021'`,
    )

    const { rows: counts } = await client.query(`
      select
        (select count(*)::int from public."user") as public_users,
        (select count(*)::int from auth.users) as auth_users,
        (select count(*)::int from public.store) as stores,
        (select count(*)::int from public.category) as categories,
        (select count(*)::int from public.taxonomy_node) as taxonomy_nodes,
        (select count(*)::int from public.product_base) as product_bases,
        (select count(*)::int from public.listing where store_id = '10000000-0000-4000-8000-000000000021') as vendor_listings,
        (select count(*)::int from public.listing
          where store_id = '10000000-0000-4000-8000-000000000021'
            and status = 'published'
            and moderation_status = 'approved') as published_listings,
        (select count(*)::int from public.listing_variant lv
          join public.listing l on l.id = lv.listing_id
          where l.store_id = '10000000-0000-4000-8000-000000000021') as variants,
        (select count(*)::int from public.publication
          where owner_id = '10000000-0000-4000-8000-000000000021'
            and lifecycle_state = 'published'
            and visibility = 'public') as published_publications
    `)

    const { rows: sampleProducts } = await client.query(
      `select title, price, stock, moderation_status, status
       from public.listing
       where store_id = '10000000-0000-4000-8000-000000000021'
       order by title
       limit 20`,
    )

    return { users, stores, counts: counts[0], sampleProducts }
  } finally {
    await client.end()
  }
}

async function main() {
  const dbUrl = await resolveProductionDbUrl({ preferPooler: true })
  if (!dbUrl) {
    printProductionDbUrlHelp()
    process.exit(1)
  }

  console.log('⚠  Bootstrapping PRODUCTION for E2E testing (idempotent)...')
  console.log('    1. seed.shared.sql')
  console.log('    2. taxonomy catalog')
  console.log('    3. admin + vendor + buyer users')
  console.log('    4. store + published products\n')

  try {
    // Prefer URI via env so failures don't echo the password in the command string.
    const runPsql = (file) => {
      execSync(`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ${file}`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl },
      })
    }

    console.log(`  → ${SEED_SHARED}`)
    runPsql(SEED_SHARED)

    console.log('  → scripts/seed-taxonomy-runtime.mjs')
    execSync('node scripts/seed-taxonomy-runtime.mjs', {
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPABASE_DB_URL: dbUrl,
        SUPABASE_LOCAL_DB_URL: dbUrl,
      },
    })

    console.log('  → bootstrap users (admin / vendor / buyer)')
    const { password, users } = await upsertBootstrapUsers(dbUrl)
    for (const user of users) {
      console.log(`     • ${user.role.padEnd(12)} ${user.email}`)
    }
    console.log(`     password: ${password}`)

    console.log(`  → ${SEED_PRODUCTION}`)
    runPsql(SEED_PRODUCTION)
  } catch (error) {
    console.error('\n✗ Production bootstrap seed failed.')
    if (error instanceof Error && error.message) {
      // Never print connection strings that may include the DB password.
      console.error(error.message.replace(/postgresql:\/\/[^@\s]+@/gi, 'postgresql://***@'))
    }
    process.exit(1)
  }

  const report = await verify(dbUrl)

  console.log('\n✓ Production E2E bootstrap completed.\n')
  console.log('── Users ──────────────────────────────────────────')
  for (const user of report.users) {
    console.log(
      `  ${user.role.padEnd(12)} ${user.email.padEnd(24)} store=${user.owns_store ? 'yes' : 'no'}`,
    )
  }
  console.log('\n── Stores ─────────────────────────────────────────')
  for (const store of report.stores) {
    console.log(`  ${store.name} (/vendor/${store.slug}) status=${store.status}`)
  }
  console.log('\n── Counts ─────────────────────────────────────────')
  console.log(`  auth users:              ${report.counts.auth_users}`)
  console.log(`  public users:            ${report.counts.public_users}`)
  console.log(`  stores:                  ${report.counts.stores}`)
  console.log(`  categories:              ${report.counts.categories}`)
  console.log(`  taxonomy_nodes:          ${report.counts.taxonomy_nodes}`)
  console.log(`  product_bases:           ${report.counts.product_bases}`)
  console.log(`  vendor listings:         ${report.counts.vendor_listings}`)
  console.log(`  published listings:      ${report.counts.published_listings}`)
  console.log(`  listing variants:        ${report.counts.variants}`)
  console.log(`  published publications:  ${report.counts.published_publications}`)
  console.log('\n── Sample products ────────────────────────────────')
  for (const product of report.sampleProducts) {
    console.log(
      `  ${product.title.padEnd(28)} $${product.price} stock=${product.stock} [${product.status}/${product.moderation_status}]`,
    )
  }

  console.log('\n══════════════════════════════════════════════════')
  console.log(' Sistema listo para pruebas end-to-end.')
  console.log(' Login con admin / vendor1 / buyer1 (password arriba).')
  console.log(' Flujos: listado, búsqueda, filtros, detalle,')
  console.log(' carrito y checkout con el comprador.')
  console.log('══════════════════════════════════════════════════\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
