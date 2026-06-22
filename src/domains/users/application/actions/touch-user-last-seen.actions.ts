'use server'

import { createClient } from '@/shared/database/supabase/server'

import { touchUserLastSeen } from '../../infrastructure/user-presence.repository'

export async function touchUserLastSeenAction(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) return

  await touchUserLastSeen()
}
