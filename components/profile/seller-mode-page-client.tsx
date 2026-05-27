'use client'

import { useRouter } from 'next/navigation'

import type { Store } from '@/types/store'
import { SellerSettings } from '@/components/profile/tabs/seller-settings'

export function SellerModePageClient({ initialStore }: { initialStore: Store | null }) {
  const router = useRouter()

  return (
    <SellerSettings
      store={initialStore}
      onStoreCreated={() => {
        // Once the store is enabled, take the user to the vendor panel.
        router.push('/dashboard')
      }}
    />
  )
}

