import type { CharacteristicMap, TemplateDef } from '@/domains/marketplace/listings/domain/product'

function getCharacteristicKeysFromTemplate(template: TemplateDef): Set<string> {
  const baseKeys = new Set(['title', 'description', 'condition', 'stock'])
  const keys = new Set<string>()
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!baseKeys.has(field.key)) keys.add(field.key)
    }
  }
  return keys
}

export function applyTemplateToCharacteristics(params: {
  template: TemplateDef
  current: CharacteristicMap
}): CharacteristicMap {
  const { template, current } = params
  const allowed = getCharacteristicKeysFromTemplate(template)

  const next: CharacteristicMap = {}

  for (const key of Object.keys(current)) {
    if (allowed.has(key)) next[key] = current[key]
  }

  for (const section of template.sections) {
    for (const field of section.fields) {
      if (!allowed.has(field.key)) continue
      if (next[field.key] !== undefined) continue
      if (field.defaultValue !== undefined) next[field.key] = field.defaultValue
    }
  }

  return next
}

export function mergeListingTemplate(template: TemplateDef | null, baseTemplate: TemplateDef): TemplateDef {
  if (!template?.sections?.length) return baseTemplate
  return { sections: [...baseTemplate.sections, ...template.sections] }
}
