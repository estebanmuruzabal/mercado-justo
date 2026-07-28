import { NextResponse } from 'next/server'

import { getTelegramWebhookSecret, isTelegramConfigured } from '@/shared/telegram/telegram/config'
import type { TelegramUpdate } from '@/shared/telegram/telegram/types'
import { handleTelegramUpdate } from '@/domains/dittobots/infrastructure/telegram-webhook.service'
import {
  getRequestIp,
  getTelegramUpdateType,
  logTelegramWebhookError,
  logTelegramWebhookReceived,
  logTelegramWebhookRequestStart,
  logTelegramWebhookSuccess,
  logTelegramWebhookUpdateSummary,
  summarizeTelegramUpdate,
} from '@/shared/telegram/telegram/webhook-observability'

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
  const startedAt = Date.now()
  const requestContext = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent'),
    updateId: null as number | null,
    updateType: null as string | null,
  }

  logTelegramWebhookRequestStart(requestContext)

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

  const rawBody = await request.text()
  let update: TelegramUpdate
  try {
    update = JSON.parse(rawBody) as TelegramUpdate
  } catch (error) {
    logTelegramWebhookError({
      updateId: null,
      elapsedMs: Date.now() - startedAt,
      message: 'invalid_payload',
      stack: error instanceof Error ? error.stack ?? null : null,
      payload: rawBody,
    })
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const summary = summarizeTelegramUpdate(update)
  requestContext.updateId = update.update_id
  requestContext.updateType = summary.update_type ?? getTelegramUpdateType(update)
  logTelegramWebhookUpdateSummary({
    updateId: update.update_id,
    updateType: summary.update_type,
    message: summary.message,
  })

  logTelegramWebhookReceived()

  try {
    // Process before responding; the handler is resilient and never throws.
    await handleTelegramUpdate(update)
    logTelegramWebhookSuccess({
      updateId: update.update_id,
      elapsedMs: Date.now() - startedAt,
      updateType: summary.update_type,
    })
  } catch (error) {
    logTelegramWebhookError({
      updateId: update.update_id,
      elapsedMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Unknown webhook error',
      stack: error instanceof Error ? error.stack ?? null : null,
      payload: summary,
    })
  }

  return NextResponse.json({ ok: true })
}
