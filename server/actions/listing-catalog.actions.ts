'use server'

import { createClient } from '@/lib/supabase/server'
import type { ListingType } from '@/types/listing'

type TemplateFieldType = 'text' | 'number' | 'textarea'

export type ListingTemplateField = {
  key: string
  label: string
  type: TemplateFieldType
  placeholder?: string
  required?: boolean
  options?: string[]
}

export type ListingTemplateSection = {
  title: string
  fields: ListingTemplateField[]
}

export type ListingTemplate = {
  sections: ListingTemplateSection[]
}

export async function getCategoriesByListingTypeAction(listingType: ListingType) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category')
    .select('id, name, parent_id, is_visible, listing_type')
    .eq('listing_type', listingType)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    name: row.name as string,
    parent_id: row.parent_id as string | null,
    is_visible: row.is_visible as boolean,
    listing_type: row.listing_type as ListingType,
  }))
}

export async function getListingTemplateForCategoryAction(
  listingType: ListingType,
  categoryId: string
): Promise<ListingTemplate | null> {
  const supabase = await createClient()

  let cur: string | null = categoryId

  while (cur) {
    const { data: tplRow, error: tplError } = await supabase
      .from('listing_template')
      .select('template')
      .eq('listing_type', listingType)
      .eq('category_id', cur)
      .maybeSingle()

    if (tplError) throw tplError

    if (tplRow?.template) {
      return tplRow.template as ListingTemplate
    }

    const { data: catRow, error: catError } = await supabase
      .from('category')
      .select('parent_id')
      .eq('id', cur)
      .maybeSingle()

    if (catError) throw catError
    cur = catRow?.parent_id ?? null
  }

  return null
}

