'use client'

import { useRouter } from 'next/navigation'

import { VENDOR_LISTINGS_PATH } from '@/shared/routing/routes'
import type { Store } from '@/domains/vendors/domain/store'
import { SellerSettings } from '@/domains/users/presentation/profile/tabs/seller-settings'

export function SellerModePageClient({ initialStore }: { initialStore: Store | null }) {
  const router = useRouter()

  return (
    <SellerSettings
      store={initialStore}
      onStoreCreated={() => {
        // Once the store is enabled, take the user to the Panel Vendedor.
        router.push(VENDOR_LISTINGS_PATH)
      }}
    />
  )
}

