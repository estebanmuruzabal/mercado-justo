#!/usr/bin/env node
/**
 * taxonomy-alimentos.xlsx + catalog + manifest → taxonomy-alimentos.json
 * Usage: npm run seed:generate-taxonomy
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(REPO_ROOT, relPath), 'utf8'))
}

function deterministicUuid(namespace, path, prefixByte) {
  const manifest = loadJson('supabase/seeds/taxonomy-id-manifest.json')
  if (manifest.categories[path]) return manifest.categories[path]
  if (path.startsWith('pb/')) {
    const slug = path.slice(3)
    if (manifest.productBases[slug]) return manifest.productBases[slug]
  }
  const hash = createHash('sha256').update(`${namespace}:${path}`).digest('hex')
  return [
    `${prefixByte}${hash.slice(1, 8)}`,
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(16, 19)}`,
    hash.slice(19, 31),
  ].join('-')
}

function resolveCategoryId(manifest, namespace, path, nameByPath) {
  if (manifest.categories[path]) return manifest.categories[path]
  const reservedPath = manifest.reservedNames?.[nameByPath.get(path)]
  if (reservedPath && manifest.categories[reservedPath]) {
    return manifest.categories[reservedPath]
  }
  return deterministicUuid(namespace, path, 'd')
}



function ensureUniqueCategorySlugs(categories) {
  const used = new Set()
  const byId = new Map(categories.map((c) => [c.id, c]))
  const ordered = [...categories].sort((a, b) => a.depth - b.depth)
  for (const category of ordered) {
    let slug = category.slug
    if (!used.has(slug)) {
      used.add(slug)
      continue
    }
    const parent = category.parentId ? byId.get(category.parentId) : null
    const suffix = parent?.slug ?? 'cat'
    slug = `${category.slug}-${suffix}`.slice(0, 80)
    let attempt = 2
    while (used.has(slug)) {
      slug = `${category.slug}-${suffix}-${attempt}`.slice(0, 80)
      attempt += 1
    }
    category.slug = slug
    used.add(slug)
  }
}

function disambiguateCategoryNames(categories) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const groups = new Map()
  for (const category of categories) {
    const list = groups.get(category.name) ?? []
    list.push(category)
    groups.set(category.name, list)
  }
  for (const [, group] of groups) {
    if (group.length <= 1) continue
    for (const category of group) {
      if (category.depth < 2) continue
      const parent = category.parentId ? byId.get(category.parentId) : null
      if (parent) category.name = `${category.name} (${parent.name})`
    }
  }
}

function hasManifestSubtree(manifest, parentPath) {
  const prefix = `${parentPath}/`
  return Object.keys(manifest.categories).some((path) => path.startsWith(prefix))
}

function injectManifestCategories(manifest, categories, rootId, rootSlug, namespace, nameByPath) {
  const pending = Object.entries(manifest.categories).sort(
    ([pathA], [pathB]) => pathA.split('/').length - pathB.split('/').length,
  )

  for (const [path, id] of pending) {
    if (categories.some((c) => c.path === path)) continue
    const parts = path.split('/')
    if (parts.length < 2) continue
    const depth = parts.length - 1
    const slug = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/')
    const parent =
      parentPath === rootSlug
        ? categories.find((c) => c.path === rootSlug)
        : categories.find((c) => c.path === parentPath)
    if (!parent) continue
    const displayName = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace('Y', 'y')
    const name =
      manifest.displayNames?.[path] ??
      (path.endsWith('/otros') && depth === 1 ? 'Otros' : displayName)
    const row = {
      id,
      name,
      slug,
      parentId: parent.id,
      path,
      depth,
    }
    categories.push(row)
    nameByPath.set(path, name)
  }
}

function parseRows(xlsxPath) {
  const workbook = XLSX.readFile(xlsxPath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 'A', defval: '' })
  let currentRoot = ''
  let currentSub1 = ''
  const parsed = []
  for (const row of rows.slice(1)) {
    if (row.A) currentRoot = String(row.A).trim()
    if (row.B) currentSub1 = String(row.B).trim()
    const sub2 = String(row.C || '').trim()
    if (!sub2 || !currentRoot || !currentSub1) continue
    parsed.push({ rootName: currentRoot, sub1Name: currentSub1, sub2Name: sub2 })
  }
  return parsed
}

function main() {
  const manifest = loadJson('supabase/seeds/taxonomy-id-manifest.json')
  const catalog = loadJson('scripts/data/product-bases-catalog.json')
  const xlsxPath = join(REPO_ROOT, 'supabase/seeds/data/taxonomy-alimentos.xlsx')
  const rows = parseRows(xlsxPath)
  const namespace = manifest.namespace

  const rootSlug = slugify(rows[0]?.rootName ?? 'alimentos-y-bebidas')
  const rootPath = rootSlug
  const rootId = resolveCategoryId(manifest, namespace, rootPath, new Map())

  const categories = [{
    id: rootId,
    name: rows[0].rootName,
    slug: rootSlug,
    parentId: null,
    path: rootPath,
    depth: 0,
  }]

  const nameByPath = new Map([[rootPath, rows[0].rootName]])
  const sub1Index = new Map()
  const sub2Index = new Map()
  const sub2Meta = new Map()

  for (const row of rows) {
    const sub1Slug = slugify(row.sub1Name)
    const sub1Path = `${rootSlug}/${sub1Slug}`
    if (!sub1Index.has(sub1Path)) {
      const id = resolveCategoryId(manifest, namespace, sub1Path, nameByPath)
      sub1Index.set(sub1Path, {
        id,
        name: row.sub1Name,
        slug: sub1Slug,
        parentId: rootId,
        path: sub1Path,
        depth: 1,
      })
      nameByPath.set(sub1Path, row.sub1Name)
      categories.push(sub1Index.get(sub1Path))
    }

    const sub2Slug = slugify(row.sub2Name)
    const sub1 = sub1Index.get(sub1Path)
    const sub2Path = `${sub1Path}/${sub2Slug}`
    if (sub2Index.has(sub2Path)) continue

    const reserved = manifest.reservedNames?.[row.sub2Name]
    const resolvedPath = reserved ?? sub2Path
    const id = resolveCategoryId(manifest, namespace, resolvedPath, nameByPath)

    sub2Index.set(sub2Path, {
      id,
      name: row.sub2Name,
      slug: sub2Slug,
      parentId: sub1.id,
      path: resolvedPath,
      depth: 2,
    })
    sub2Meta.set(sub2Path, { sub1Name: row.sub1Name, sub2Name: row.sub2Name })
    nameByPath.set(resolvedPath, row.sub2Name)
    categories.push(sub2Index.get(sub2Path))
  }

  injectManifestCategories(manifest, categories, rootId, rootSlug, namespace, nameByPath)
  disambiguateCategoryNames(categories)
  ensureUniqueCategorySlugs(categories)

  const productBases = []
  const seenSlugs = new Set(['lechuga-romana'])

  for (const [sub2Path, sub2] of sub2Index) {
    if (hasManifestSubtree(manifest, sub2.path)) continue

    const meta = sub2Meta.get(sub2Path)
    const catalogKey = meta ? `${meta.sub1Name}/${meta.sub2Name}` : sub2.name
    const products = catalog[catalogKey] ?? catalog[sub2.name]
    if (!products?.length) {
      console.warn(`No catalog for sub2: ${sub2.name}`)
      continue
    }
    for (const name of products.slice(0, 5)) {
      const slug = slugify(name)
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)
      const pbPath = `pb/${slug}`
      productBases.push({
        id: deterministicUuid(namespace, pbPath, 'f'),
        name,
        slug,
        categoryId: rootId,
        subcategoryId: sub2.id,
        subcategoryPath: sub2.path,
        type: 'PRODUCT',
        status: 'ACTIVE',
        imageStrategy: 'LISTING_REQUIRED',
        source: 'seed',
      })
    }
  }

  const sub2Ids = new Set([...sub2Index.values()].map((sub2) => sub2.id))

  for (const category of categories) {
    if (sub2Ids.has(category.id)) continue
    const isLeaf = !categories.some((candidate) => candidate.parentId === category.id)
    if (!isLeaf) continue

    const products = catalog[category.name]
    if (!products?.length) continue

    for (const name of products.slice(0, 5)) {
      const slug = slugify(name)
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)
      const pbPath = `pb/${slug}`
      productBases.push({
        id: deterministicUuid(namespace, pbPath, 'f'),
        name,
        slug,
        categoryId: rootId,
        subcategoryId: category.id,
        subcategoryPath: category.path,
        type: 'PRODUCT',
        status: 'ACTIVE',
        imageStrategy: 'LISTING_REQUIRED',
        source: 'seed',
      })
    }
  }

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    namespace,
    rootCategoryId: rootId,
    categories,
    productBases,
    stats: {
      categories: categories.length,
      productBases: productBases.length,
      sub2Leaves: sub2Index.size,
    },
  }

  const outPath = join(REPO_ROOT, 'supabase/seeds/data/taxonomy-alimentos.json')
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(`✓ Wrote ${outPath}`)
  console.log(`  categories: ${output.stats.categories}`)
  console.log(`  product bases: ${output.stats.productBases}`)
}

main()
