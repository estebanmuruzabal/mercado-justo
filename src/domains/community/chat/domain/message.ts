export const MESSAGE_BODY_MAX_LENGTH = 4000
export const MESSAGE_PREVIEW_MAX_LENGTH = 120

export function normalizeMessageBody(body: string): string {
  return body.replace(/\r\n/g, '\n').trim()
}

export function isValidMessageBody(body: string): boolean {
  const normalized = normalizeMessageBody(body)
  return normalized.length > 0 && normalized.length <= MESSAGE_BODY_MAX_LENGTH
}

export function truncateMessagePreview(body: string): string {
  const normalized = normalizeMessageBody(body)
  if (normalized.length <= MESSAGE_PREVIEW_MAX_LENGTH) return normalized
  return `${normalized.slice(0, MESSAGE_PREVIEW_MAX_LENGTH - 3)}...`
}
