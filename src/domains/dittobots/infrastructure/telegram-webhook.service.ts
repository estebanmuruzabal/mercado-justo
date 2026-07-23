import { getEnvironmentBadge } from '@/shared/config/environment'
import { answerCallbackQuery, sendMessage } from '@/shared/telegram/telegram/client'
import { parseStartPayload } from '@/shared/telegram/telegram/link'
import { bold, lines } from '@/shared/telegram/telegram/messages'
import { parseUserStartPayload } from '@/shared/telegram/telegram/user-link'
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/shared/telegram/telegram/types'
import {
  userTelegramConnectErrorMessage,
  userTelegramConnectSuccessMessage,
} from '@/domains/users/domain/user-telegram-connection'
import { connectUserByToken, findUserTelegramConnectionWithService } from '@/domains/users/infrastructure/user-telegram.service'

import { connectByToken } from './telegram.service'
import {
  logTelegramStartMessage,
  logTelegramUserConnectAttempt,
  logTelegramUserConnectFinal,
  logTelegramWebhookUpdate,
} from '@/shared/telegram/telegram/user-connect-debug'

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
    logTelegramWebhookUpdate(update)

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
  const telegramUserId = message.from?.id ?? chatId

  if (text.startsWith('/start')) {
    const payload = text.slice('/start'.length).trim()
    const parsedConnectToken = parseUserStartPayload(payload)

    logTelegramStartMessage({
      messageText: text,
      command: '/start',
      rawPayload: payload,
      parsedConnectToken,
      chatId,
      fromId: message.from?.id ?? null,
      username,
    })

    await handleStart(chatId, telegramUserId, username, payload)
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

async function handleStart(
  chatId: number,
  telegramUserId: number,
  username: string | null,
  payload: string,
): Promise<void> {
  const userToken = parseUserStartPayload(payload)
  if (userToken) {
    await handleUserConnect(chatId, telegramUserId, username, userToken)
    return
  }

  const vendorToken = parseStartPayload(payload)
  if (!vendorToken) {
    await reply(
      chatId,
      lines(
        '👋 ' + bold('Bienvenido a Mercado Justo'),
        '',
        'Para vincular tu cuenta personal, abrí “Datos personales” en tu perfil',
        'y tocá “Conectar Telegram”.',
        '',
        'Para conectar tu tienda como vendedor, usá la sección “Notificaciones”',
        'en el panel de vendedor.',
      ),
    )
    return
  }

  await handleVendorConnect(chatId, username, vendorToken)
}

async function handleUserConnect(
  chatId: number,
  telegramUserId: number,
  username: string | null,
  token: string,
): Promise<void> {
  logTelegramUserConnectAttempt({
    token,
    chatId,
    telegramUserId,
    username,
  })

  const result = await connectUserByToken(token, chatId, telegramUserId, username)

  const linkedUserId = 'userId' in result ? result.userId : null
  const connectionState = linkedUserId
    ? await findUserTelegramConnectionWithService(linkedUserId)
    : null

  logTelegramUserConnectFinal({
    userId: linkedUserId,
    resultStatus: result.status,
    telegramConnected: connectionState?.telegramConnected ?? false,
    telegramChatId: connectionState?.telegramChatId ?? null,
    telegramUserId: connectionState?.telegramUserId ?? null,
    telegramUsername: connectionState?.telegramUsername ?? null,
    telegramConnectedAt: connectionState?.telegramConnectedAt ?? null,
  })

  if (result.status === 'connected' || result.status === 'already_connected') {
    await reply(chatId, userTelegramConnectSuccessMessage(result))
    return
  }

  await reply(chatId, userTelegramConnectErrorMessage(result))
}

async function handleVendorConnect(
  chatId: number,
  username: string | null,
  token: string,
): Promise<void> {
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
  await answerCallbackQuery(query.id)
}

function helpText(): string {
  return lines(
    bold('Comandos disponibles'),
    '',
    '/start — vincular tu cuenta o tu tienda',
    '/help — mostrar esta ayuda',
  )
}
