import type {
  UserContactProfileDto,
  UserContactSettingsDto,
} from '../dto/user-contact.dto'
import {
  findUserContactProfile,
  findUserContactSettings,
} from '../../infrastructure/user-contact.repository'

export async function getUserContactSettings(
  userId: string,
): Promise<UserContactSettingsDto | null> {
  return findUserContactSettings(userId)
}

export async function getUserContactProfile(
  userId: string,
): Promise<UserContactProfileDto | null> {
  return findUserContactProfile(userId)
}
