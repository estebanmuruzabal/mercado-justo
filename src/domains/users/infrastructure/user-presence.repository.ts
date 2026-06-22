import { createClient } from '@/shared/database/supabase/server'

export async function touchUserLastSeen(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.schema('public').rpc('touch_user_last_seen')

  if (error) throw error
}
