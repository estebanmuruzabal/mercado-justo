#!/usr/bin/env node

/**
 * Register / inspect / delete the Telegram webhook for development, staging or production.
 *
 * Usage:
 *   npm run telegram:webhook:set -- --env=development
 *   npm run telegram:webhook:set -- --env=production
 *   npm run telegram:webhook:info -- --env=production
 *   npm run telegram:webhook:delete -- --env=staging
 *
 * When setting the webhook, the script prints the selected environment, bot
 * username, a masked token suffix and the final webhook URL before contacting
 * Telegram.
 */

const { loadEnv } = require('./lib/load-env')

const WEBHOOK_PATH = '/api/telegram/webhook'
const VALID_ENVS = new Set(['development', 'staging', 'production'])

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

function parseArgs(argv) {
  const args = [...argv]
  let env = null
  let explicitUrl = null

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (!arg) continue

    if (arg === '--env') {
      env = args[i + 1] || null
      i += 1
      continue
    }

    if (arg.startsWith('--env=')) {
      env = arg.slice('--env='.length) || null
      continue
    }

    if (arg === '--info' || arg === '--delete') continue
    if (!arg.startsWith('--') && !explicitUrl) {
      explicitUrl = arg
    }
  }

  return { env, explicitUrl }
}

function resolveTargetEnv(explicitEnv) {
  const cliEnv = explicitEnv?.trim().toLowerCase()
  if (cliEnv) {
    if (!VALID_ENVS.has(cliEnv)) {
      fail(`Invalid --env value "${explicitEnv}". Use development, staging or production.`)
    }
    return cliEnv
  }

  const loadedEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase()
  if (loadedEnv && VALID_ENVS.has(loadedEnv)) return loadedEnv

  switch (process.env.VERCEL_ENV) {
    case 'production':
      return 'production'
    case 'preview':
      return 'staging'
    case 'development':
      return 'development'
    default:
      return 'development'
  }
}

function envFilesFor(targetEnv) {
  switch (targetEnv) {
    case 'production':
      return ['.env.production', '.env.production.local']
    case 'staging':
      return ['.env.staging', '.env.staging.local']
    default:
      return ['.env', '.env.local']
  }
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '')
}

function resolveSiteUrl(targetEnv) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return normalizeBaseUrl(explicit)

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${normalizeBaseUrl(vercel)}`

  if (targetEnv === 'development') return 'http://localhost:3000'
  return null
}

function resolveWebhookUrl(targetEnv, explicitUrl) {
  if (explicitUrl) return explicitUrl.trim()

  const siteUrl = resolveSiteUrl(targetEnv)
  if (!siteUrl) {
    fail(
      'No se pudo resolver la URL pública. Seteá NEXT_PUBLIC_SITE_URL o pasá la URL explícitamente.',
    )
  }

  return new URL(WEBHOOK_PATH, siteUrl).toString()
}

function assertSafeUrl(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    fail(`Webhook URL inválida: ${url}`)
  }

  if (parsed.protocol !== 'https:') {
    fail(
      `Webhook URL must be HTTPS. Telegram rejects non-HTTPS URLs.\n` +
        `Got: ${url}\n` +
        `For local development, use an HTTPS tunnel (ngrok/cloudflared).`,
    )
  }

  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    fail(
      `Webhook URL points to localhost (${url}). Telegram can't reach local-only hosts.\n` +
        `Use a public HTTPS tunnel instead.`,
    )
  }
}

function maskToken(token) {
  if (!token) return '(missing)'
  if (token.length <= 6) return token
  return `***${token.slice(-6)}`
}

function getBotUsername() {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim()
  if (!username) fail('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set.')
  return username.replace(/^@/, '')
}

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) fail('TELEGRAM_BOT_TOKEN is not set.')
  return token
}

function api(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`
}

async function call(token, method, body) {
  const res = await fetch(api(token, method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) fail(`Telegram "${method}" failed: ${json.description || res.status}`)
  return json.result
}

async function printContext(targetEnv, token) {
  const me = await call(token, 'getMe')
  console.log(`Environment : ${targetEnv}`)
  console.log(`Bot username: @${getBotUsername()}`)
  console.log(`Token       : ${maskToken(token)}`)
  console.log(`Telegram bot: @${me.username} (${me.first_name})`)
}

async function main() {
  const args = process.argv.slice(2)
  const { env: envFlag, explicitUrl } = parseArgs(args)
  const targetEnv = resolveTargetEnv(envFlag)

  loadEnv(envFilesFor(targetEnv))

  const token = getToken()
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null
  const webhookUrl = resolveWebhookUrl(targetEnv, explicitUrl)

  const isInfo = args.includes('--info')
  const isDelete = args.includes('--delete')

  if (isInfo) {
    await printContext(targetEnv, token)
    const info = await call(token, 'getWebhookInfo')
    console.log('\nWebhook info:')
    console.log(JSON.stringify(info, null, 2))
    return
  }

  if (isDelete) {
    await printContext(targetEnv, token)
    console.log(`Webhook URL : ${webhookUrl}`)
    await call(token, 'deleteWebhook', { drop_pending_updates: false })
    console.log('\n✓ Webhook deleted.')
    return
  }

  assertSafeUrl(webhookUrl)

  await printContext(targetEnv, token)
  console.log(`Webhook URL : ${webhookUrl}`)

  if (!secret) {
    console.warn('\n⚠ TELEGRAM_WEBHOOK_SECRET is not set — the webhook will accept unauthenticated requests.')
  }

  await call(token, 'setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    ...(secret ? { secret_token: secret } : {}),
  })

  console.log(`\n✓ Webhook registered for ${targetEnv}:`)
  console.log(`  ${webhookUrl}`)
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)))
