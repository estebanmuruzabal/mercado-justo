// components/profile/profile-content.tsx
import type { UserLocationSettingsDto } from '@/domains/users/application/dto/user-location.dto'
import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { ListingManager } from '@/domains/marketplace/listings/presentation/components/ListingManager'
import { DittoBots } from './tabs/ditto-bots'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'ditto'
type ProfileUser = { email?: string }

const EMPTY_LOCATION_SETTINGS: UserLocationSettingsDto = {
  latitude: null,
  longitude: null,
  locationVisibility: false,
  locationPrivacy: { mode: 'city' },
  city: null,
  province: null,
}

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
      return <PersonalData user={user} initialLocationSettings={EMPTY_LOCATION_SETTINGS} />

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