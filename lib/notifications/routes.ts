export const VENDOR_NOTIFICATIONS_PATH = '/dashboard-vendor/notifications'
export const PROFILE_NOTIFICATIONS_PATH = '/profile/notifications'

export function getAllNotificationsPath(isSeller: boolean) {
  return isSeller ? VENDOR_NOTIFICATIONS_PATH : PROFILE_NOTIFICATIONS_PATH
}
