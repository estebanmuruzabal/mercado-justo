import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'

import {
  attributeTypeRequiresOptions,
  attributeTypeSupportsNumericValidation,
  attributeTypeSupportsTextValidation,
} from '../attribute-type-registry'
import type { ProductBaseImageStrategy } from '../product-base'
import type {
  ProductBaseAttributeInput,
  ProductBaseAttributeValidation,
} from '../product-base-attribute'

export class ProductBaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductBaseValidationError'
  }
}

export function assertSingleVariantDimension(attributes: ProductBaseAttributeInput[]): void {
  const variantCount = attributes.filter((attr) => attr.isVariantDimension).length
  if (variantCount > 1) {
    throw new ProductBaseValidationError(
      'Solo se permite un atributo con dimensión de variante por Product Base.',
    )
  }
}

export function assertVariantPricingRules(attributes: ProductBaseAttributeInput[]): void {
  for (const attr of attributes) {
    if (attr.allowVariantPricing && !attr.isVariantDimension) {
      throw new ProductBaseValidationError(
        `El atributo "${attr.key}" solo puede permitir pricing por variante si es dimensión de variante.`,
      )
    }
  }
}

export function assertImageStrategyRules(input: {
  baseImageUrl: string | null | undefined
  imageStrategy: ProductBaseImageStrategy
}): void {
  if (input.imageStrategy === 'LISTING_REQUIRED' && input.baseImageUrl) {
    throw new ProductBaseValidationError(
      'LISTING_REQUIRED no permite imagen en el Product Base.',
    )
  }
}

export function assertSubcategoryBelongsToCategory(input: {
  categoryId: string
  subcategoryId: string | null | undefined
  categories: AdminCategoryRow[]
}): void {
  if (!input.subcategoryId) return

  const byId = new Map(input.categories.map((category) => [category.id, category]))
  const subcategory = byId.get(input.subcategoryId)
  if (!subcategory) {
    throw new ProductBaseValidationError('La subcategoría no existe.')
  }

  let current = subcategory
  while (current.parentId) {
    if (current.parentId === input.categoryId) {
      return
    }
    const parent = byId.get(current.parentId)
    if (!parent) break
    current = parent
  }

  throw new ProductBaseValidationError('La subcategoría debe pertenecer a la categoría seleccionada.')
}

function assertValidationRules(
  type: ProductBaseAttributeInput['type'],
  validation: ProductBaseAttributeValidation | null | undefined,
  key: string,
): void {
  if (!validation) return

  const hasNumeric =
    validation.min !== undefined ||
    validation.max !== undefined ||
    validation.step !== undefined
  const hasText =
    validation.minLength !== undefined ||
    validation.maxLength !== undefined ||
    validation.regex !== undefined

  if (hasNumeric && !attributeTypeSupportsNumericValidation(type)) {
    throw new ProductBaseValidationError(
      `El atributo "${key}" no admite validación numérica para el tipo ${type}.`,
    )
  }
  if (hasText && !attributeTypeSupportsTextValidation(type)) {
    throw new ProductBaseValidationError(
      `El atributo "${key}" no admite validación de texto para el tipo ${type}.`,
    )
  }
}

export function assertProductBaseAttributes(attributes: ProductBaseAttributeInput[]): void {
  assertSingleVariantDimension(attributes)
  assertVariantPricingRules(attributes)

  const keys = new Set<string>()
  for (const attr of attributes) {
    const normalizedKey = attr.key.trim()
    if (!normalizedKey) {
      throw new ProductBaseValidationError('Cada atributo debe tener una key.')
    }
    if (keys.has(normalizedKey)) {
      throw new ProductBaseValidationError(`Key duplicada: "${normalizedKey}".`)
    }
    keys.add(normalizedKey)

    if (attributeTypeRequiresOptions(attr.type)) {
      if (!attr.options || attr.options.length === 0) {
        throw new ProductBaseValidationError(
          `El atributo "${normalizedKey}" requiere opciones para ${attr.type}.`,
        )
      }
    } else if (attr.options && attr.options.length > 0) {
      throw new ProductBaseValidationError(
        `El atributo "${normalizedKey}" no admite opciones para el tipo ${attr.type}.`,
      )
    }

    assertValidationRules(attr.type, attr.validation, normalizedKey)
  }
}

export function assertProductBaseWriteInput(input: {
  categoryId: string
  subcategoryId?: string | null
  baseImageUrl?: string | null
  imageStrategy: ProductBaseImageStrategy
  attributes: ProductBaseAttributeInput[]
  categories: AdminCategoryRow[]
}): void {
  assertSubcategoryBelongsToCategory({
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    categories: input.categories,
  })
  assertImageStrategyRules({
    baseImageUrl: input.baseImageUrl,
    imageStrategy: input.imageStrategy,
  })
  assertProductBaseAttributes(input.attributes)
}
