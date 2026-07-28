'use client'

import { ProfileTelegramSection } from './profile-telegram-section'
import type { UserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'

type ProfileUser = {
  email?: string
  telegramSettings: UserTelegramSettings
  telegramConfigured: boolean
}

export function PersonalData({ user }: { user: ProfileUser }) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Datos personales</h2>

        <input className='w-full border p-2' defaultValue={user.email} />
        <input className='w-full border p-2' placeholder='Nombre' />

        <div>
          <label>Foto</label>
          <input type='file' />
        </div>

        <button type='button' className='rounded bg-black px-4 py-2 text-white'>
          Guardar
        </button>
      </div>

      <ProfileTelegramSection
        initialSettings={user.telegramSettings}
        configured={user.telegramConfigured}
      />
    </div>
  )
}
