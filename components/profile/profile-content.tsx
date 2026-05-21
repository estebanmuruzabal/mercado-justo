// components/profile/profile-content.tsx
'use client'

import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { ListingManager } from '@/components/listings/ListingManager'
import { DittoBots } from './tabs/ditto-bots'
import type { Store } from '@/types/store'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'ditto'

export function ProfileContent({
  tab,
  user,
  store,
  onStoreCreated,
}: {
  tab: TabId
  user: { email?: string }
  store: Store | null
  onStoreCreated: (store: Store) => void
}) {
  switch (tab) {
    case 'personal':
      return <PersonalData user={user} />

    case 'security':
      return <Security />

    case 'seller':
      return <SellerSettings store={store} onStoreCreated={onStoreCreated} />

    case 'products':
      return store ? <ListingManager /> : <p>Activá modo vendedor</p>

    case 'ditto':
      return <DittoBots />

    default:
      return null
  }
}