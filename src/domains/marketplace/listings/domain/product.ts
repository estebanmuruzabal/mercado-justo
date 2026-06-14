// Product/listing templates and dynamic characteristics.
// Kept separate from `lib/listing.ts` to avoid mixing marketplace-wide listing
// concerns (types/labels/cart) with template-specific “product” concerns.

// -----------------------------
// Templates / dynamic fields
// -----------------------------

export type FieldType = 'text' | 'number' | 'textarea'

// Matches the JSON structure stored in `public.listing_template.template`.
export type TemplateField = {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: string[]

  // Optional default coming from the DB JSON (if present).
  defaultValue?: CharacteristicValue
}

export type TemplateSection = {
  title: string
  fields: TemplateField[]
}

export type TemplateDef = {
  sections: TemplateSection[]
}

// Generic JSON-ish value for `characteristics` payloads.
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

export type CharacteristicValue = JsonValue

export type CharacteristicMap = Record<string, CharacteristicValue>

