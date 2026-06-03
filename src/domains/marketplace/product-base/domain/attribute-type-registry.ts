import type { ProductBaseAttributeType } from './product-base-attribute'

export const OPTION_ATTRIBUTE_TYPES = ['SELECT', 'MULTISELECT'] as const satisfies readonly ProductBaseAttributeType[]

export const NUMERIC_ATTRIBUTE_TYPES = [
  'NUMBER',
  'CURRENCY',
  'PERCENTAGE',
] as const satisfies readonly ProductBaseAttributeType[]

export const TEXT_LIKE_ATTRIBUTE_TYPES = [
  'TEXT',
  'TEXTAREA',
  'EMAIL',
  'URL',
  'PHONE',
] as const satisfies readonly ProductBaseAttributeType[]

export function attributeTypeRequiresOptions(type: ProductBaseAttributeType): boolean {
  return (OPTION_ATTRIBUTE_TYPES as readonly string[]).includes(type)
}

export function attributeTypeSupportsNumericValidation(type: ProductBaseAttributeType): boolean {
  return (NUMERIC_ATTRIBUTE_TYPES as readonly string[]).includes(type)
}

export function attributeTypeSupportsTextValidation(type: ProductBaseAttributeType): boolean {
  return (TEXT_LIKE_ATTRIBUTE_TYPES as readonly string[]).includes(type)
}
