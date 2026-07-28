import { NextResponse } from 'next/server'

import { isDevelopment } from '@/shared/config/environment'
import { createClient } from '@/shared/database/supabase/server'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { isStaff } from '@/domains/users/domain/roles'
import {
  getTelegramWebhookDiagnostics,
  logTelegramDiagnosticsReport,
} from '@/shared/telegram/telegram/webhook-observability'

export const dynamic = 'force-dynamic'

async function assertDiagnosticsAccess(): Promise<NextResponse | null> {
  if (isDevelopment) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const role = await getUserRoleByUserId(user.id)
  if (!isStaff(role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  return null
}

export async function GET() {
  const denied = await assertDiagnosticsAccess()
  if (denied) return denied

  try {
    const diagnostics = await getTelegramWebhookDiagnostics()
    logTelegramDiagnosticsReport(diagnostics)

    return NextResponse.json(
      {
        ok: true,
        diagnostics,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown diagnostics error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
