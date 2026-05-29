import { NextResponse } from 'next/server'

import { getTelegramWebhookSecret, isTelegramConfigured } from '@/lib/telegram/config'
import type { TelegramUpdate } from '@/lib/telegram/types'
import { handleTelegramUpdate } from '@/server/services/telegram-webhook.service'

/**
 * Telegram Bot API webhook.
 *
 * Telegram POSTs updates here. We authenticate via the secret token configured
 * with `setWebhook` (sent back in the `X-Telegram-Bot-Api-Secret-Token` header),
 * then hand the update to the domain handler. We always respond 200 on accepted
 * input so Telegram does not retry, while rejecting clearly unauthorized calls.
 */

// Telegram updates must always hit the live handler.
export const dynamic = 'force-dynamic'

const SECRET_HEADER = 'x-telegram-bot-api-secret-token'

export async function POST(request: Request) {
  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: 'telegram_not_configured' }, { status: 503 })
  }

  const expectedSecret = getTelegramWebhookSecret()
  if (expectedSecret) {
    const provided = request.headers.get(SECRET_HEADER)
    if (provided !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  // Process before responding; the handler is resilient and never throws.
  await handleTelegramUpdate(update)

  return NextResponse.json({ ok: true })
}
