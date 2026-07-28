/** Lifetime of a Telegram account connect token (must match server minting TTL). */
export const TELEGRAM_LINK_TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

/** Deep-link `/start` payload prefix for user account linking. */
export const TELEGRAM_START_PAYLOAD_PREFIX = 'connect_'
