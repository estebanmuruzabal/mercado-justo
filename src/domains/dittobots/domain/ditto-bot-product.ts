import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'

import { normalizeDittoBotSettings, type DittoBotSettings } from './ditto-bot-settings'

export class DittoBotProductValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DittoBotProductValidationError'
  }
}

export type DittoBotProductInput = {
  title: string
  description: string
  categoryId: string
  price: number
  tags: string[]
  dittoBotSettings: DittoBotSettings
}

export function normalizeTags(raw: string[] | string): string[] {
  const items = Array.isArray(raw)
    ? raw
    : raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

  return [...new Set(items.map((t) => t.trim()).filter(Boolean))]
}

export function assertDittoBotCategory(
  categoryId: string,
  categories: AdminCategoryRow[],
): AdminCategoryRow {
  const category = categories.find((c) => c.id === categoryId)
  if (!category) {
    throw new DittoBotProductValidationError('La categoría seleccionada no existe.')
  }

  if (category.listingType !== 'product') {
    throw new DittoBotProductValidationError('Los DittoBots deben usar categorías de tipo producto.')
  }

  const hasParents = categories.some((c) => c.parentId !== null)
  if (hasParents && category.parentId === null) {
    throw new DittoBotProductValidationError(
      'Seleccioná una subcategoría (categoría con padre).',
    )
  }

  return category
}

export function assertDittoBotTags(tags: string[]): string[] {
  const normalized = normalizeTags(tags)
  if (normalized.length < 1) {
    throw new DittoBotProductValidationError('Agregá al menos un tag.')
  }
  return normalized
}

export function assertDittoBotImage(image: string | null | undefined): string {
  const value = image?.trim()
  if (!value) {
    throw new DittoBotProductValidationError('Agregá una imagen principal del producto.')
  }
  return value
}

export function buildDittoBotCharacteristics(input: {
  tags: string[]
  image?: string | null
  images?: string[]
}): Record<string, unknown> {
  const tags = assertDittoBotTags(input.tags)
  const payload: Record<string, unknown> = { tags }

  if (input.image?.trim()) {
    payload.image = input.image.trim()
  }

  const gallery = (input.images ?? []).map((url) => url.trim()).filter(Boolean)
  if (gallery.length > 0) {
    payload.images = gallery
  }

  return payload
}

export function parseDittoBotProductInput(input: {
  title: string
  description: string
  categoryId: string
  price: number
  tags: string[] | string
  dittoBotSettings?: unknown
}): DittoBotProductInput {
  const title = input.title.trim()
  const description = input.description.trim()

  if (title.length < 3) {
    throw new DittoBotProductValidationError('El título debe tener al menos 3 caracteres.')
  }
  if (description.length < 10) {
    throw new DittoBotProductValidationError('La descripción debe tener al menos 10 caracteres.')
  }
  if (input.price <= 0) {
    throw new DittoBotProductValidationError('El precio debe ser mayor a cero.')
  }

  return {
    title,
    description,
    categoryId: input.categoryId,
    price: input.price,
    tags: normalizeTags(input.tags),
    dittoBotSettings: normalizeDittoBotSettings(input.dittoBotSettings),
  }
}
