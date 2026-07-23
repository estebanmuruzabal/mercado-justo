export type UserTelegramConnectionDto = {
  telegramConnected: boolean
  telegramUserId: string | null
  telegramChatId: string | null
  telegramUsername: string | null
  telegramConnectedAt: string | null
}

export type ConnectUserTelegramByTokenResult =
  | { status: 'connected'; userId: string }
  | { status: 'already_connected'; userId: string }
  | { status: 'invalid_token' }
  | { status: 'expired_token' }
  | { status: 'chat_taken' }

export function userTelegramConnectErrorMessage(
  result: Exclude<ConnectUserTelegramByTokenResult, { status: 'connected' | 'already_connected' }>,
): string {
  switch (result.status) {
    case 'invalid_token':
      return 'El enlace no es válido o ya fue utilizado. Generá uno nuevo desde tu perfil.'
    case 'expired_token':
      return 'El enlace expiró. Volvé a tu perfil y tocá “Conectar Telegram” para generar uno nuevo.'
    case 'chat_taken':
      return 'Esta cuenta de Telegram ya está vinculada a otro usuario de Mercado Justo.'
  }
}

export function userTelegramConnectSuccessMessage(
  result: Extract<ConnectUserTelegramByTokenResult, { status: 'connected' | 'already_connected' }>,
): string {
  if (result.status === 'already_connected') {
    return '✅ Tu cuenta de Telegram ya estaba vinculada con Mercado Justo.'
  }
  return '✅ Tu cuenta de Telegram quedó vinculada correctamente con Mercado Justo.'
}
