import { MarketplaceBrowseClient } from '@/domains/marketplace/listings/presentation/marketplace/MarketplaceBrowseClient'
import { fetchMarketplaceCategories, fetchMarketplaceListings } from '@/domains/marketplace/listings/application/queries/marketplace.queries'

export default async function Home() {
  const [initialListings, categories] = await Promise.all([
    fetchMarketplaceListings({ limit: 200 }),
    fetchMarketplaceCategories(),
  ])

  return (
    <MarketplaceBrowseClient initialListings={initialListings} categories={categories} />
  )
}
