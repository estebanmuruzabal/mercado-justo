export type PublicationEventMap = {
  'marketplace.publication.created': { publicationId: string; ownerId: string; publicationType: string }
  'marketplace.publication.updated': { publicationId: string }
  'marketplace.publication.submitted': { publicationId: string }
  'marketplace.publication.published': { publicationId: string; ownerId: string }
  'marketplace.publication.suspended': { publicationId: string; reason?: string }
  'marketplace.publication.archived': { publicationId: string }
  'marketplace.publication.deleted': { publicationId: string }
  'marketplace.review.created': { publicationId: string; reviewId: string; authorId: string }
  'marketplace.publication.followed': { publicationId: string; userId: string }
  'marketplace.publication.viewed': { publicationId: string }
  'marketplace.cart.updated': { userId: string; cartId: string }
  'marketplace.transaction.created': { transactionId: string; kind: string }
  'marketplace.transaction.confirmed': { transactionId: string; kind: string; buyerId: string; sellerId: string }
  'marketplace.transaction.completed': { transactionId: string }
  'marketplace.transaction.cancelled': { transactionId: string }
}

export type MarketplacePublicationEventType = keyof PublicationEventMap

export type MarketplacePublicationEvent = {
  [K in MarketplacePublicationEventType]: { type: K; payload: PublicationEventMap[K] }
}[MarketplacePublicationEventType]
