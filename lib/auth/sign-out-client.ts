import { broadcastAuthSessionSync } from '@/lib/auth/session-sync'
import { createClient } from '@/lib/supabase/client'

/** Clears Supabase session in the browser and refreshes header auth state. */
export async function signOutClient() {
  const supabase = createClient()
  await supabase.auth.signOut()
  broadcastAuthSessionSync()
}
