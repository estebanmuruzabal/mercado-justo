import { getEnvironmentBadge } from '@/lib/config/environment'
import { answerCallbackQuery, sendMessage } from '@/lib/telegram/client'
import { bold, lines } from '@/lib/telegram/messages'
import { parseStartPayload } from '@/lib/telegram/link'
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/lib/telegram/types'

import { connectByToken } from './telegram.service'

/**
 * Inbound Telegram update handler.
 *
 * Kept intentionally small and switch-based so new commands / callbacks can be
 * added without touching the transport route. Designed to never throw to the
 * caller: failures are logged and swallowed so the webhook can always 200.
 */

/** Send a reply to a chat, tagged with the environment badge in non-prod. */
async function reply(chatId: number, text: string): Promise<void> {
  await sendMessage({ chatId, text: `${getEnvironmentBadge()}${text}` })
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.message) {
      await handleMessage(update.message)
      return
    }
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
      return
    }
  } catch (err) {
    console.error('[telegram] webhook handler error:', err instanceof Error ? err.message : err)
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim() ?? ''
  const chatId = message.chat.id
  const username = message.from?.username ?? message.chat.username ?? null

  if (text.startsWith('/start')) {
    const payload = text.slice('/start'.length).trim()
    await handleStart(chatId, username, payload)
    return
  }

  if (text.startsWith('/help')) {
    await reply(chatId, helpText())
    return
  }

  // Unknown input: gently point the user to the help command.
  await reply(
    chatId,
    lines('No reconozco ese mensaje. 🤔', 'Usá /help para ver qué puedo hacer.'),
  )
}

async function handleStart(
  chatId: number,
  username: string | null,
  payload: string,
): Promise<void> {
  const token = parseStartPayload(payload)

  // Plain /start with no (valid) connect token: show onboarding instructions.
  if (!token) {
    await reply(
      chatId,
      lines(
        '👋 ' + bold('Bienvenido a Mercado Justo'),
        '',
        'Para conectar tu tienda y recibir notificaciones, abrí la sección',
        '“Notificaciones” en tu panel de vendedor y tocá “Conectar Telegram”.',
      ),
    )
    return
  }

  const settings = await connectByToken(token, chatId, username)

  if (!settings) {
    await reply(
      chatId,
      lines(
        '⚠️ ' + bold('El enlace expiró o no es válido'),
        '',
        'Volvé al panel de vendedor y generá un nuevo enlace desde',
        'la sección “Notificaciones”.',
      ),
    )
    return
  }

  await reply(
    chatId,
    lines(
      '✅ ' + bold('¡Tienda conectada!'),
      '',
      'Vas a recibir acá tus alertas de ventas y novedades.',
      'Podés ajustar tus preferencias desde el panel de vendedor.',
    ),
  )
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  // Placeholder for future inline-button actions (order state changes, etc.).
  // Acknowledge so the client stops showing a loading state.
  await answerCallbackQuery(query.id)
}

function helpText(): string {
  return lines(
    bold('Comandos disponibles'),
    '',
    '/start — conectar tu tienda o ver instrucciones',
    '/help — mostrar esta ayuda',
  )
}
