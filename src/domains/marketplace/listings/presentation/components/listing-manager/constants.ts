import type { TemplateDef } from '@/domains/marketplace/listings/domain/product'

import type { DraftFormState } from './types'

/** Base template always present; DB template adds extra sections/fields. */
export const BASE_TEMPLATE: TemplateDef = {
  sections: [
    {
      title: 'Información básica',
      fields: [
        { key: 'title', label: 'Título', type: 'text', required: true },
        { key: 'description', label: 'Descripción', type: 'textarea', required: true },
        { key: 'condition', label: 'Condición (new/used)', type: 'text', required: true },
        { key: 'stock', label: 'Stock', type: 'number' },
      ],
    },
  ],
}

export const EMPTY_FORM: DraftFormState = {
  listingId: null,
  listingType: null,
  categoryId: null,
  subcategoryId: null,
  categoryPath: [],
  productBaseId: null,
  productBase: null,
  selectedProductBase: null,
  title: '',
  description: '',
  condition: 'new',
  stock: 0,
  latitude: null,
  longitude: null,
  characteristics: {},
  images: [],
  pendingListingImages: [],
  enableVariants: false,
  simplePrice: null,
  simpleSku: null,
  price: null,
  status: 'draft',
}
