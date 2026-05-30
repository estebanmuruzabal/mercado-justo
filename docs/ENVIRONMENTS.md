# Environments & Configuration

Professional, SaaS-style separation of **development**, **staging**, and **production**.

| Environment   | Where it runs              | Supabase            | Telegram bot          | Site URL                         |
| ------------- | -------------------------- | ------------------- | --------------------- | -------------------------------- |
| `development` | Local machine              | `supabase start`    | `@MercadoJustoDevBot` | `http://localhost:3000` (+ngrok) |
| `staging`     | Vercel **Preview** deploys | Staging project     | `@MercadoJustoDevBot` | `https://staging.midominio.com`  |
| `production`  | Vercel **Production**      | Production project  | `@MercadoJustoBot`    | `https://midominio.com`          |

---

## 1. Core principles

1. **One source of truth per concern.**
   - Environment identity + public URL → [`lib/config/environment.ts`](../lib/config/environment.ts) (client-safe).
   - Validated server secrets → [`lib/env.ts`](../lib/env.ts) (server-only).
2. **No duplicated variables.** All local config lives in `.env.local`. `.env` is intentionally empty. Staging/production live in Vercel.
3. **Never hardcode URLs.** Always use `getSiteUrl()` / `absoluteUrl()` from `lib/config/environment`.
4. **Secrets never reach the client.** Only `NEXT_PUBLIC_*` vars are exposed to the browser. `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, etc. are server-only.
5. **One bot per environment** so real users, notifications, and webhooks never mix.

---

## 2. Environment variables

| Variable                              | Public | Required        | Notes                                            |
| ------------------------------------- | :----: | --------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_APP_ENV`                 |   ✅   | yes             | `development` \| `staging` \| `production`       |
| `NEXT_PUBLIC_SITE_URL`                |   ✅   | yes (non-local) | Absolute base URL, no trailing slash             |
| `NEXT_PUBLIC_SUPABASE_URL`            |   ✅   | yes             | Per-environment Supabase URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       |   ✅   | yes\*           | Anon/publishable key (\* one of anon/publishable)|
| `SUPABASE_SERVICE_ROLE_KEY`           |   ❌   | yes             | Server secret. Webhooks/admin tasks              |
| `TELEGRAM_BOT_TOKEN`                  |   ❌   | for Telegram    | Server secret from @BotFather                    |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`   |   ✅   | for Telegram    | Bot username without `@` (must match the token)  |
| `TELEGRAM_WEBHOOK_SECRET`             |   ❌   | for Telegram    | `openssl rand -hex 32`; validated on the webhook |
| `RESEND_API_KEY`                      |   ❌   | for email       | Server secret from [Resend Dashboard](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL`                   |   ❌   | for email       | Sender address (default test: `onboarding@resend.dev`) |
| `RESEND_REPLY_TO`                     |   ❌   | for email       | Optional reply-to address |

**Auth emails** (signup confirmation, password reset) use **Supabase Auth** native flows — not Resend.

**Operational emails** (orders, vendor approval, moderation, etc.) use **Resend** via `lib/notifications/email/send.ts`. Preview templates locally:

```bash
npm run email:dev
```

In test mode (`onboarding@resend.dev`), Resend only delivers to the email address on your Resend account. Verify a custom domain in production before going live.

`APP_ENV` resolution order: `NEXT_PUBLIC_APP_ENV` → `VERCEL_ENV` (production→production, preview→staging) → `NODE_ENV`.

Validate any environment with:

```bash
npm run env:check
```

---

## 3. Local development

```bash
# 1. Start local Supabase
supabase start

# 2. Create your local env file from the template
cp .env.example .env.local

# 3. Fill Supabase keys from the local stack
supabase status -o env      # copy ANON_KEY + SERVICE_ROLE_KEY

# 4. Verify and run
npm run env:check
npm run dev
```

### Telegram locally (HTTPS required)

Telegram won't call `http://localhost`. Expose the dev server over HTTPS:

```bash
# Terminal A
npm run dev

# Terminal B — pick one tunnel:
npm run dev:tunnel        # ngrok http 3000
npm run dev:tunnel:cf     # cloudflared tunnel --url http://localhost:3000
```

Then:

1. Copy the public `https://…` URL into `NEXT_PUBLIC_SITE_URL` in `.env.local`.
2. Restart `npm run dev` (env vars are read at boot).
3. Register the webhook for your **dev bot**:

```bash
npm run telegram:webhook:set
npm run telegram:webhook:info     # confirm bot + URL
```

> Tip: a reserved ngrok domain (see [`ngrok.yml`](../ngrok.yml)) keeps the URL stable so you don't re-register on every restart.

---

## 4. Staging & Production (Vercel)

Vercel maps deployments to environments automatically:

- **Preview deployments** (PRs / non-production branches) → treat as **staging**.
- **Production deployment** (production branch) → **production**.

### Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add each variable and scope it:

| Scope in Vercel | Use for      | `NEXT_PUBLIC_APP_ENV` |
| --------------- | ------------ | --------------------- |
| Production      | production   | `production`          |
| Preview         | staging      | `staging`             |
| Development     | `vercel dev` | `development`         |

Or via CLI:

```bash
vercel env add NEXT_PUBLIC_APP_ENV production       # type: production
vercel env add NEXT_PUBLIC_APP_ENV preview          # type: staging
vercel env add NEXT_PUBLIC_SITE_URL production      # https://midominio.com
vercel env add NEXT_PUBLIC_SITE_URL preview         # https://staging.midominio.com
vercel env add SUPABASE_SERVICE_ROLE_KEY production # (secret)
vercel env add TELEGRAM_BOT_TOKEN production         # production bot
vercel env add TELEGRAM_BOT_TOKEN preview            # dev bot
# …repeat for the remaining variables
```

Pull them locally if needed: `vercel env pull .env.local`.

### Supabase per environment

- **Staging**: a separate Supabase project. Apply migrations with `supabase db push` against it.
- **Production**: the real Supabase project. Migrations are the only way to change schema (see `CLAUDE.md`).

Never point staging/production at the local stack, and never share service-role keys across environments.

### Register Telegram webhooks per environment

Run with that environment's variables loaded (e.g. after `vercel env pull`, or in a deploy hook):

```bash
# Production
NEXT_PUBLIC_SITE_URL=https://midominio.com \
TELEGRAM_BOT_TOKEN=<prod-token> \
TELEGRAM_WEBHOOK_SECRET=<prod-secret> \
node scripts/telegram-set-webhook.js

# Staging
NEXT_PUBLIC_SITE_URL=https://staging.midominio.com \
TELEGRAM_BOT_TOKEN=<dev-token> \
TELEGRAM_WEBHOOK_SECRET=<staging-secret> \
node scripts/telegram-set-webhook.js
```

The webhook handler ([`app/api/telegram/webhook/route.ts`](../app/api/telegram/webhook/route.ts)) validates the `TELEGRAM_WEBHOOK_SECRET` on every request and rejects unauthorized calls.

---

## 5. Security checklist

- [ ] Real secrets only in `.env.local` (gitignored) and Vercel — never committed.
- [ ] `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are **not** `NEXT_PUBLIC_*`.
- [ ] Distinct `TELEGRAM_WEBHOOK_SECRET` per environment (`openssl rand -hex 32`).
- [ ] Separate bots: dev/staging use `@MercadoJustoDevBot`, production uses `@MercadoJustoBot`.
- [ ] `NEXT_PUBLIC_SITE_URL` is HTTPS in staging/production (`npm run env:check` enforces this).
- [ ] Separate Supabase projects for staging vs production.

Non-production Telegram messages are automatically prefixed (`🛠️ [DEV]` / `🧪 [STAGING]`) via `getEnvironmentBadge()` so they're never mistaken for production alerts.

---

## 6. Quick reference

```bash
npm run env:check               # validate current environment
npm run dev                     # local dev server
npm run dev:tunnel              # HTTPS tunnel (ngrok)
npm run dev:tunnel:cf           # HTTPS tunnel (cloudflared)
npm run telegram:webhook:set    # register webhook for current env
npm run telegram:webhook:info   # show bot + webhook status
npm run telegram:webhook:delete # remove webhook
npm run email:dev               # preview React Email templates
```
