// components/profile/profile-content.tsx
import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { ListingManager } from '@/components/listings/ListingManager'
import { DittoBots } from './tabs/ditto-bots'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'ditto'
type ProfileUser = { email?: string }

export function ProfileContent({
  tab,
  user,
  isSeller,
}: {
  tab: TabId
  user: ProfileUser
  isSeller: boolean
  setIsSeller: (next: boolean) => void
}) {
  switch (tab) {
    case 'personal':
      return <PersonalData user={user} />

    case 'security':
      return <Security />

    case 'seller':
      // This file is a lightweight route switch; keep it type-safe even if seller data
      // is provided elsewhere in the real profile flow.
      return <SellerSettings store={null} onStoreCreated={() => {}} />

    case 'products':
      return isSeller ? <ListingManager /> : <p>Activá modo vendedor</p>

    case 'ditto':
      return <DittoBots />

    default:
      return null
  }
}