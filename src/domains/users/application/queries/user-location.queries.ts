import type { UserLocationSettingsDto } from '../dto/user-location.dto'
import { findUserLocationSettings } from '../../infrastructure/user-location.repository'

export async function getUserLocationSettings(userId: string): Promise<UserLocationSettingsDto | null> {
  return findUserLocationSettings(userId)
}
