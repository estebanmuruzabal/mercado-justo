// Legacy lightweight profile switcher — keep types aligned with PersonalData.
import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { ListingManager } from '@/domains/marketplace/listings/presentation/components/ListingManager'
import { DittoBots } from './tabs/ditto-bots'
import type { UserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

type TabId = 'personal' | 'security' | 'seller' | 'products' | 'ditto'
type ProfileUser = {
  email?: string
  telegramSettings: UserTelegramSettings
  telegramConfigured: boolean
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
      return <PersonalData user={user} />

    case 'security':
      return <Security />

    case 'seller':
      return <SellerSettings store={null} onStoreCreated={() => {}} />

    case 'products':
      return isSeller ? <ListingManager /> : <p>Activá modo vendedor</p>

    case 'ditto':
      return <DittoBots />

    default:
      return null
  }
}
