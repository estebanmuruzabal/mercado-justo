// components/profile/profile-content.tsx
'use client'

import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { ListingManager } from '@/domains/marketplace/listings/presentation/components/ListingManager'
import { DittoBots } from './tabs/ditto-bots'
import type { Store } from '@/domains/vendors/domain/store'
import { PurchasesTab } from './tabs/purchases'
import { SalesTab } from './tabs/sales'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'purchases' | 'sales' | 'ditto'

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

    case 'purchases':
      return <PurchasesTab />

    case 'sales':
      return store ? <SalesTab storeId={store.id} /> : <p>Activá modo vendedor</p>

    case 'ditto':
      return <DittoBots />

    default:
      return null
  }
}