import { getEnvironmentBadge } from '@/shared/config/environment'
import { answerCallbackQuery, sendMessage } from '@/shared/telegram/telegram/client'
import { bold, lines } from '@/shared/telegram/telegram/messages'
import { parseStartPayload } from '@/shared/telegram/telegram/link'
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/shared/telegram/telegram/types'

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
    console.error('[Telegram Webhook] webhook handler error:', err instanceof Error ? err.message : err)
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim() ?? ''
  const chatId = message.chat.id
  const username = message.from?.username ?? message.chat.username ?? null

  console.info('[Telegram Webhook] message.text', {
    chatId,
    username,
    text,
  })

  if (text.startsWith('/start')) {
    const payload = text.slice('/start'.length).trim()
    await handleStart(message, payload)
    return
  }

  if (text.startsWith('/help')) {
    await reply(chatId, helpText())
    return
  }

  await reply(
    chatId,
    lines('No reconozco ese mensaje. 🤔', 'Usá /help para ver qué puedo hacer.'),
  )
}

async function handleStart(message: TelegramMessage, payload: string): Promise<void> {
  const chatId = message.chat.id
  const username = message.from?.username ?? message.chat.username ?? null
  const telegramUserId = message.from?.id != null ? String(message.from.id) : null
  const firstName = message.from?.first_name ?? null
  const token = parseStartPayload(payload)

  console.info('[Telegram Webhook] comando recibido', {
    command: '/start',
    hasToken: Boolean(token),
    chatId,
    telegramUserId,
  })

  if (!token) {
    await reply(
      chatId,
      lines(
        '👋 ' + bold('Bienvenido a Mercado Justo'),
        '',
        'Para vincular tu cuenta, abrí tu perfil en la app,',
        'sección “Datos personales”, y tocá “Conectar Telegram”.',
        '',
        'Si sos vendedor, también podés hacerlo desde',
        'Notificaciones en el panel de vendedor.',
      ),
    )
    return
  }

  const result = await connectByToken(token, chatId, username, telegramUserId, firstName)

  if (result.status === 'connected' || result.status === 'already_connected') {
    console.info('[Telegram Webhook] usuario encontrado', {
      userId: result.settings.userId,
      status: result.status,
    })
    await reply(
      chatId,
      lines(
        '✅ ' + bold('Tu cuenta de Mercado Justo fue conectada correctamente.'),
        '',
        'Vas a poder recibir avisos acá.',
        'Podés revisar el estado desde tu perfil.',
      ),
    )
    return
  }

  if (result.status === 'expired_token') {
    console.info('[Telegram Webhook] errores', { reason: 'expired_token' })
    await reply(
      chatId,
      lines(
        '⚠️ ' + bold('El enlace expiró'),
        '',
        'Volvé a tu perfil en Mercado Justo y generá un nuevo enlace',
        'desde “Conectar Telegram”.',
      ),
    )
    return
  }

  if (result.status === 'chat_taken') {
    console.info('[Telegram Webhook] errores', { reason: 'chat_taken' })
    await reply(
      chatId,
      lines(
        '⚠️ ' + bold('Esta cuenta de Telegram ya está vinculada'),
        '',
        'Está asociada a otro usuario de Mercado Justo.',
        'Desconectala desde ese perfil antes de vincularla de nuevo.',
      ),
    )
    return
  }

  console.info('[Telegram Webhook] errores', { reason: 'invalid_token' })
  await reply(
    chatId,
    lines(
      '⚠️ ' + bold('El enlace no es válido o ya fue utilizado'),
      '',
      'Volvé a tu perfil y generá un nuevo enlace con “Conectar Telegram”.',
    ),
  )
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  await answerCallbackQuery(query.id)
}

function helpText(): string {
  return lines(
    bold('Comandos disponibles'),
    '',
    '/start — conectar tu cuenta o ver instrucciones',
    '/help — mostrar esta ayuda',
  )
}
