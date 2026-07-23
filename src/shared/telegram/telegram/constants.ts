/** Lifetime of a Telegram account connect token (must match server minting TTL). */
export const TELEGRAM_LINK_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

/** Vendor deep-link `/start` payload prefix. */
export const TELEGRAM_START_PAYLOAD_PREFIX = 'vendor_'

/** End-user profile deep-link `/start` payload prefix. */
export const USER_TELEGRAM_START_PAYLOAD_PREFIX = 'connect_'
