import { createClient } from '@/lib/supabase/server'
import { SearchHero } from '@/components/features/navbar/search-hero'
import {
  ListingSection,
  type ProductListing,
  type OtherListing,
} from '@/components/features/homepage/listing-section'


const mockProducts: ProductListing[] = [
  {
    id: '1',
    listingType: 'product',
    title: 'Arduino ESP32 DevKit',
    subtitle: '$12 USD',
    hasOptions: false,
    price: 12,
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    listingType: 'product',
    title: 'Indoor Grow Light',
    subtitle: '$89 USD',
    hasOptions: true,
    price: 89,
    priceSecondary: "from $/unit",
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    listingType: 'product',
    title: 'Hydroponic Kit',
    subtitle: '$120 USD',
    hasOptions: false,
    price: 120,
    priceSecondary: "multi-pack",
    image:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop',
  },
]

const mockServices: OtherListing[] = [
  {
    id: '1',
    listingType: 'service',
    title: 'Web Development',
    subtitle: 'From $500',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    listingType: 'service',
    title: '3D Printing Service',
    subtitle: 'From $20',
    image:
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop',
  },
]

const mockProperties: OtherListing[] = [
  {
    id: '1',
    listingType: 'property',
    title: 'Apartment in Palermo',
    subtitle: '$100/night',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    listingType: 'property',
    title: 'Tiny House',
    subtitle: '$60/night',
    image:
      'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop',
  },
]

const mockExperiences: OtherListing[] = [
  {
    id: '1',
    listingType: 'experience',
    title: 'Organic Farm Tour',
    subtitle: '$15 per person',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    listingType: 'experience',
    title: 'Cooking Workshop',
    subtitle: '$25 per person',
    image:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
  },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email

  return (
     <main className="min-h-screen bg-background">
       
        <SearchHero email={userEmail}/>

        <div className="space-y-14 px-6 pb-20 pt-10 md:px-10">
          <ListingSection
            title="Products near you"
            listings={mockProducts}
          />

          <ListingSection
            title="Services near you"
            listings={mockServices}
          />

          <ListingSection
            title="Properties near you"
            listings={mockProperties}
          />

          <ListingSection
            title="Experiences near you"
            listings={mockExperiences}
          />
        </div>
      </main>
  )
}