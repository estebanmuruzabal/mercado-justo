export type UserContactMethodsDto = {
  phoneNumber: string | null
  whatsappNumber: string | null
  telegramUsername: string | null
  telegramConnected: boolean
  telegramConnectedAt: string | null
  telegramUserId: string | null
  telegramChatId: string | null
}

export type UserContactPreferencesDto = {
  allowPhoneCalls: boolean
  allowWhatsappMessages: boolean
  allowTelegramMessages: boolean
  allowEmailContact: boolean
  preferredContactHours: string | null
}

export type UserContactSettingsDto = UserContactMethodsDto & UserContactPreferencesDto

export type UpdateUserContactMethodsInput = {
  phoneNumber?: string | null
  whatsappNumber?: string | null
  telegramUsername?: string | null
}

export type UpdateUserContactPreferencesInput = {
  allowPhoneCalls?: boolean
  allowWhatsappMessages?: boolean
  allowTelegramMessages?: boolean
  allowEmailContact?: boolean
  preferredContactHours?: string | null
}

export type UpdateUserContactSettingsInput = UpdateUserContactMethodsInput &
  UpdateUserContactPreferencesInput

/** GraphQL / AI routing read model (mirrors user_contact_profile view). */
export type UserContactProfileDto = {
  userId: string
  email: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  telegramUsername: string | null
  telegramConnected: boolean
  telegramConnectedAt: string | null
  telegramUserId: string | null
  telegramChatId: string | null
  allowPhoneCalls: boolean
  allowWhatsappMessages: boolean
  allowTelegramMessages: boolean
  allowEmailContact: boolean
  preferredContactHours: string | null
}
