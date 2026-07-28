#!/usr/bin/env node
/**
 * Reads taxonomy-alimentos.json and upserts categories + product bases.
 * Usage: node scripts/seed-taxonomy-runtime.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const DB_URL =
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_LOCAL_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function loadTaxonomy() {
  const path = join(REPO_ROOT, 'supabase/seeds/data/taxonomy-alimentos.json')
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function upsertCategory(client, category) {
  await client.query('SELECT public.seed_upsert_category($1::uuid, $2::text, $3::text, $4::uuid, $5::public.listing_type, $6::boolean)', [
    category.id,
    category.name,
    category.slug,
    category.parentId,
    'product',
    true,
  ])
}

async function upsertProductBase(client, pb) {
  await client.query(
    `INSERT INTO public.product_base (
      id, name, slug, description, category_id, subcategory_id,
      type, status, image_strategy, source
    ) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      category_id = EXCLUDED.category_id,
      subcategory_id = EXCLUDED.subcategory_id,
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      image_strategy = EXCLUDED.image_strategy,
      source = EXCLUDED.source,
      updated_at = now()`,
    [
      pb.id,
      pb.name,
      pb.slug,
      pb.categoryId,
      pb.subcategoryId,
      pb.type,
      pb.status,
      pb.imageStrategy,
      pb.source,
    ],
  )
}

async function main() {
  const taxonomy = loadTaxonomy()
  const client = new Client({ connectionString: DB_URL })
  await client.connect()

  try {
    await client.query('BEGIN')
    const sortedCategories = [...taxonomy.categories].sort((a, b) => a.depth - b.depth)
    for (const category of sortedCategories) {
      await upsertCategory(client, category)
    }
    for (const pb of taxonomy.productBases) {
      await upsertProductBase(client, pb)
    }
    await client.query('COMMIT')
    console.log(`✓ Taxonomy seed: ${sortedCategories.length} categories, ${taxonomy.productBases.length} product bases`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('✗ Taxonomy seed failed:', error.message)
  process.exit(1)
})
