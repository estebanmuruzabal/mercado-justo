import { MarketplaceBrowseClient } from '@/domains/marketplace/listings/presentation/marketplace/MarketplaceBrowseClient'
import { fetchDiscoveryFeed, fetchMarketplaceCategories } from '@/domains/marketplace/discovery'

export default async function Home() {
  const [initialListings, categories] = await Promise.all([
    fetchDiscoveryFeed({ limit: 200 }),
    fetchMarketplaceCategories(),
  ])

  return (
    <MarketplaceBrowseClient initialListings={initialListings} categories={categories} />
  )
}
