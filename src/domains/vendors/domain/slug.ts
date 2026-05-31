/**
 * Slug helpers for the public vendor storefront (/vendor/[slug]).
 *
 * The canonical URL slug is kebab-case (lowercase, spaces -> "-", special chars
 * removed) to match URLs like `/vendor/the-tree-kings`. Keep this in sync with
 * the SQL `public.slugify(text)` function used to backfill/validate on the DB.
 */

const DIACRITICS = /[\u0300-\u036f]/g

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Whether a slug is structurally valid (lowercase letters/numbers/dashes). */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export const SLUG_MIN_LENGTH = 2
export const SLUG_MAX_LENGTH = 60
