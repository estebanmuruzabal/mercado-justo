/** Marketplace bounded context — universal publication hub for Ditto Ecosystem. */
export * as shared from './shared'
export * as publication from './publication'
export * as taxonomy from './taxonomy'
export * as discovery from './discovery'
export * as offer from './offer'
export * as relations from './relations'
export * as transaction from './transaction'
export * as types from './types/editor-plugin-registry'
export * as legacy from './_legacy/listing-adapter'

// Legacy submodules (Strangler — prefer publication/discovery/transaction)
export * as listings from './listings'
export * as categories from './categories'
export * as orders from './orders'
export * as checkout from './checkout'
export * as reviews from './reviews'
