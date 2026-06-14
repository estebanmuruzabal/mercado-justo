import { NextResponse } from 'next/server'

import { createClient } from '@/shared/database/supabase/server'
import { isGrowerMember } from '@/domains/dittobots/domain/grower-capability'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isGrower: false, authenticated: false })
  }

  const isGrower = await isGrowerMember(user.id)
  return NextResponse.json({ isGrower, authenticated: true })
}
