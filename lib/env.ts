import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Public base URL of the app (used for absolute links in Telegram messages).
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Telegram bot integration. Optional so the app builds/runs without it;
  // the Telegram feature throws a clear error at call time when missing.
  // Token from @BotFather. Server-only secret.
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  // Bot username without the leading "@" (e.g. "MercadoJustoBot"), used to build deep links.
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
  // Shared secret validated on the inbound webhook (X-Telegram-Bot-Api-Secret-Token header).
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)