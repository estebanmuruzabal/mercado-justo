import { MarketplaceBrowseClient } from '@/components/marketplace/MarketplaceBrowseClient'
import { fetchMarketplaceCategories, fetchMarketplaceListings } from '@/server/queries/marketplace.queries'

export default async function Home() {
  const [initialListings, categories] = await Promise.all([
    fetchMarketplaceListings({ limit: 200 }),
    fetchMarketplaceCategories(),
  ])

  return (
    <MarketplaceBrowseClient initialListings={initialListings} categories={categories} />
  )
}
