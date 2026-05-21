import { createClient } from '@/lib/supabase/server'
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
    storeId: 'mock-store-id-1',
    variantId: 'mock-variant-id-1',
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
    storeId: 'mock-store-id-2',
    variantId: 'mock-variant-id-2',
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
    storeId: 'mock-store-id-3',
    variantId: 'mock-variant-id-3',
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

  // Fetch published products for the homepage.
  // Note: DB RLS must allow public reads for `status='published'`,
  // and we must also allow selecting `public.store.name` for the join.
  const { data: productRows, error: productError } = await supabase
    .from('listing')
    .select(
      'id,title,price,store_id,characteristics,created_at,store(name),listing_variant(id,price,stock,is_default,attributes_json)',
    )
    .eq('listing_type', 'product')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12)

  type ProductRow = {
    id: string
    title: string | null
    price: number | null
    store_id: string
    characteristics: unknown
    store?: { name: string | null } | null
    listing_variant?: Array<{
      id: string
      price: number | null
      stock: number | null
      is_default: boolean
      attributes_json?: unknown
    }> | null
  }

  const products: ProductListing[] = productError
    ? mockProducts
    : ((productRows ?? []) as ProductRow[]).map((row) => {
        const variantRows = row.listing_variant ?? []
        const defaultVariant = variantRows.find((v) => v.is_default) ?? variantRows[0]

        const defaultVariantAttributes = (defaultVariant?.attributes_json ?? {}) as Record<string, unknown>

        const titleFromAttributes =
          typeof defaultVariantAttributes.name === 'string' ? (defaultVariantAttributes.name as string) : null
        const imageFromAttributes =
          typeof defaultVariantAttributes.image === 'string' ? (defaultVariantAttributes.image as string) : null
        const hasOptionsFromCount = variantRows.length > 1

        const storeName = row.store?.name ?? undefined
        const variantId = defaultVariant?.id ?? row.id
        const variantPrice = defaultVariant?.price ?? row.price ?? 0

        return {
          id: String(row.id),
          listingType: 'product',
          title: titleFromAttributes ?? row.title ?? '',
          subtitle: storeName ? `Por ${storeName}` : '',
          hasOptions: hasOptionsFromCount,
          price: Number(variantPrice ?? 0),
          image:
            imageFromAttributes ??
            'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
          storeId: String(row.store_id),
          variantId: String(variantId),
        }
      })

  return (
     <main className="min-h-screen bg-background">

        <div className="space-y-14 px-6 pb-20 pt-10 md:px-10">
          <ListingSection
            title="Products near you"
            listings={products}
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