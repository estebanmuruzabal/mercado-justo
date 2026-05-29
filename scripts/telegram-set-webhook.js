#!/usr/bin/env node

/**
 * Register (or update) the Telegram webhook for the centralized bot.
 *
 * Usage:
 *   node scripts/telegram-set-webhook.js https://your-domain.com/api/telegram/webhook
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN       (required)  token from @BotFather
 *   TELEGRAM_WEBHOOK_SECRET  (optional)  shared secret echoed back by Telegram
 *
 * Pass --delete to remove the webhook instead.
 */

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN must be set')
  process.exit(1)
}

const arg = process.argv[2]

async function main() {
  if (arg === '--delete') {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
    })
    console.log(JSON.stringify(await res.json(), null, 2))
    return
  }

  if (!arg || !/^https:\/\//.test(arg)) {
    console.error('Usage: node scripts/telegram-set-webhook.js https://your-domain.com/api/telegram/webhook')
    console.error('       node scripts/telegram-set-webhook.js --delete')
    process.exit(1)
  }

  const body = {
    url: arg,
    allowed_updates: ['message', 'callback_query'],
  }
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = await res.json()
  console.log(JSON.stringify(payload, null, 2))
  if (!payload.ok) process.exit(1)
  console.log('\n✓ Webhook registered:', arg)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
