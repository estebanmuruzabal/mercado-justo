import { SIGN_IN_PATH } from '@/shared/routing/routes'
import { createClient } from '@/shared/database/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(SIGN_IN_PATH)
  }
  
  return <>{children}</>
}