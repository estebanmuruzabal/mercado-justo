export function formatConversationTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (60 * 1000))

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} d`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 52) return `${diffWeeks} sem`

  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
