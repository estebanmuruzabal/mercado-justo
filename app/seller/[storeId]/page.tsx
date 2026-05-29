import { notFound, redirect } from 'next/navigation'

import { publicVendorPath } from '@/lib/routes'
import { getVendorSlugByStoreId } from '@/server/queries/vendor.queries'

/**
 * Legacy route. The public storefront now lives at /vendor/[slug]; resolve the
 * slug for this store id and redirect so old links keep working.
 */
export default async function LegacySellerProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const slug = await getVendorSlugByStoreId(storeId)

  if (!slug) notFound()

  redirect(publicVendorPath(slug))
}
