import { broadcastAuthSessionSync } from '@/domains/auth/domain/auth/session-sync'
import { createClient } from '@/shared/database/supabase/client'

/** Clears Supabase session in the browser and refreshes header auth state. */
export async function signOutClient() {
  const supabase = createClient()
  await supabase.auth.signOut()
  broadcastAuthSessionSync()
}
