#!/usr/bin/env node

/**
 * Register / inspect / delete the Telegram webhook for the CURRENT environment.
 *
 * The bot is environment-scoped: whichever TELEGRAM_BOT_TOKEN is loaded decides
 * which bot (dev vs prod) gets configured. Run this per environment.
 *
 * Usage:
 *   npm run telegram:webhook:set            # uses NEXT_PUBLIC_SITE_URL
 *   npm run telegram:webhook:set -- https://my-domain.com/api/telegram/webhook
 *   npm run telegram:webhook:info
 *   npm run telegram:webhook:delete
 *
 * Env (loaded from .env / .env.local, or the real shell/CI env):
 *   TELEGRAM_BOT_TOKEN       (required)
 *   TELEGRAM_WEBHOOK_SECRET  (recommended)
 *   NEXT_PUBLIC_SITE_URL     (used to derive the webhook URL when none is passed)
 *   NEXT_PUBLIC_APP_ENV      (shown for confirmation)
 */

const { loadEnv } = require('./lib/load-env')

loadEnv()

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development'
const WEBHOOK_PATH = '/api/telegram/webhook'

const API = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

async function call(method, body) {
  const res = await fetch(API(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) fail(`Telegram "${method}" failed: ${json.description || res.status}`)
  return json.result
}

function resolveWebhookUrl(arg) {
  if (arg) return arg
  if (!SITE_URL) {
    fail('No URL provided and NEXT_PUBLIC_SITE_URL is not set. Pass the webhook URL explicitly.')
  }
  return `${SITE_URL.replace(/\/+$/, '')}${WEBHOOK_PATH}`
}

function assertSafeUrl(url) {
  if (!/^https:\/\//.test(url)) {
    fail(`Webhook URL must be HTTPS (Telegram rejects http/localhost). Got: ${url}\n` +
      '  For local dev, expose localhost with ngrok/cloudflared and use that URL.')
  }
  if (/localhost|127\.0\.0\.1/.test(url)) {
    fail(`Webhook URL points to localhost (${url}). Use a public HTTPS tunnel.`)
  }
}

async function printBotIdentity() {
  const me = await call('getMe')
  console.log(`Environment : ${APP_ENV}`)
  console.log(`Bot         : @${me.username} (${me.first_name})`)
}

async function main() {
  if (!TOKEN) fail('TELEGRAM_BOT_TOKEN is not set.')

  const arg = process.argv[2]

  if (arg === '--info') {
    await printBotIdentity()
    const info = await call('getWebhookInfo')
    console.log('\nWebhook info:')
    console.log(JSON.stringify(info, null, 2))
    return
  }

  if (arg === '--delete') {
    await printBotIdentity()
    await call('deleteWebhook', { drop_pending_updates: false })
    console.log('\n✓ Webhook deleted.')
    return
  }

  const url = resolveWebhookUrl(arg)
  assertSafeUrl(url)

  await printBotIdentity()

  if (!SECRET) {
    console.warn('\n⚠ TELEGRAM_WEBHOOK_SECRET is not set — the webhook will accept unauthenticated requests.')
  }

  await call('setWebhook', {
    url,
    allowed_updates: ['message', 'callback_query'],
    ...(SECRET ? { secret_token: SECRET } : {}),
  })

  console.log(`\n✓ Webhook registered for ${APP_ENV}:`)
  console.log(`  ${url}`)
}

main().catch((err) => fail(err.message))
