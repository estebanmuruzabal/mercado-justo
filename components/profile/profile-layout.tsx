// components/profile/profile-content.tsx
import { PersonalData } from './tabs/personal-data'
import { Security } from './tabs/security'
import { SellerSettings } from './tabs/seller-settings'
import { Products } from './tabs/products'
import { DittoBots } from './tabs/ditto-bots'

export function ProfileContent({ tab, user, isSeller, setIsSeller }: any) {
  switch (tab) {
    case 'personal':
      return <PersonalData user={user} />

    case 'security':
      return <Security />

    case 'seller':
      return <SellerSettings isSeller={isSeller} setIsSeller={setIsSeller} />

    case 'products':
      return isSeller ? <Products /> : <p>Activá modo vendedor</p>

    case 'ditto':
      return <DittoBots />

    default:
      return null
  }
}