import { SIGN_IN_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { redirect } from 'next/navigation'

import { ProfilePageClient } from '@/domains/users/presentation/profile/profile-page-client'
import { getStoreByUserId } from '@/domains/vendors/infrastructure/store.service'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { getUserContactSettings } from '@/domains/users/application/queries/user-contact.queries'
import { getUserLocationSettings } from '@/domains/users/application/queries/user-location.queries'
import { getUserMessagingSettings } from '@/domains/users/application/queries/user-messaging.queries'
import type { UserContactSettingsDto } from '@/domains/users/application/dto/user-contact.dto'
import type { UserLocationSettingsDto } from '@/domains/users/application/dto/user-location.dto'
import type { UserMessagingSettingsDto } from '@/domains/users/application/dto/user-messaging.dto'

const EMPTY_LOCATION_SETTINGS: UserLocationSettingsDto = {
  latitude: null,
  longitude: null,
  locationVisibility: false,
  locationPrivacy: { mode: 'city' },
  city: null,
  province: null,
}

const EMPTY_MESSAGING_SETTINGS: UserMessagingSettingsDto = {
  allowDirectMessages: false,
}

const EMPTY_CONTACT_SETTINGS: UserContactSettingsDto = {
  phoneNumber: null,
  whatsappNumber: null,
  telegramUsername: null,
  telegramConnected: false,
  telegramConnectedAt: null,
  telegramUserId: null,
  telegramChatId: null,
  allowPhoneCalls: false,
  allowWhatsappMessages: false,
  allowTelegramMessages: false,
  allowEmailContact: true,
  preferredContactHours: null,
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(SIGN_IN_PATH)
  }

  const [store, role, locationSettings, messagingSettings, contactSettings] = await Promise.all([
    getStoreByUserId(user.id),
    getUserRoleByUserId(user.id),
    getUserLocationSettings(user.id),
    getUserMessagingSettings(user.id),
    getUserContactSettings(user.id),
  ])

  return (
    <ProfilePageClient
      userEmail={user?.email ?? ''}
      initialStore={store}
      initialRole={role}
      initialLocationSettings={locationSettings ?? EMPTY_LOCATION_SETTINGS}
      initialMessagingSettings={messagingSettings ?? EMPTY_MESSAGING_SETTINGS}
      initialContactSettings={contactSettings ?? EMPTY_CONTACT_SETTINGS}
    />
  )
}
