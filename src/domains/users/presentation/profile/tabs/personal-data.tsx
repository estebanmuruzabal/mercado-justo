'use client'

import type { UserContactSettingsDto } from '@/domains/users/application/dto/user-contact.dto'
import type { UserMessagingSettingsDto } from '@/domains/users/application/dto/user-messaging.dto'
import type { UserLocationSettingsDto } from '@/domains/users/application/dto/user-location.dto'

import { UserContactSettingsSection } from '../contact/UserContactSettingsSection'
import { LocationSettingsCard } from '../location/LocationSettingsCard'
import { MessagingSettingsCard } from '../messaging/MessagingSettingsCard'

type ProfileUser = { email?: string }

export function PersonalData({
  user,
  initialLocationSettings,
  initialMessagingSettings,
  initialContactSettings,
}: {
  user: ProfileUser
  initialLocationSettings: UserLocationSettingsDto
  initialMessagingSettings: UserMessagingSettingsDto
  initialContactSettings: UserContactSettingsDto
}) {
  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Datos personales</h2>

        <input className='w-full rounded-md border p-2' defaultValue={user.email} readOnly aria-readonly />
        <input className='w-full rounded-md border p-2' placeholder='Nombre' />

        <div>
          <label className='text-sm font-medium'>Foto</label>
          <input type='file' className='mt-1 block w-full text-sm' />
        </div>
      </div>

      <UserContactSettingsSection initialSettings={initialContactSettings} />
      <LocationSettingsCard initialSettings={initialLocationSettings} />
      <MessagingSettingsCard initialSettings={initialMessagingSettings} />
    </div>
  )
}
