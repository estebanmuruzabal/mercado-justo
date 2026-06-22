import type { UserMessagingSettingsDto } from '../dto/user-messaging.dto'
import { findUserMessagingSettings } from '../../infrastructure/user-messaging.repository'

export async function getUserMessagingSettings(
  userId: string,
): Promise<UserMessagingSettingsDto | null> {
  return findUserMessagingSettings(userId)
}
