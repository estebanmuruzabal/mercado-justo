'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/shared/database/supabase/server'
import {
  PROFILE_NOTIFICATIONS_PATH,
  VENDOR_NOTIFICATIONS_PATH,
} from '@/shared/routing/routes'

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('notification')
    .update({ read: true } as never)
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath(PROFILE_NOTIFICATIONS_PATH)
  revalidatePath(VENDOR_NOTIFICATIONS_PATH)
}

export async function markAllNotificationsReadAction(audience: 'buyer' | 'vendor') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('notification')
    .update({ read: true } as never)
    .eq('user_id', user.id)
    .eq('audience', audience)
    .eq('read', false)

  if (error) throw error

  revalidatePath(PROFILE_NOTIFICATIONS_PATH)
  revalidatePath(VENDOR_NOTIFICATIONS_PATH)
}
