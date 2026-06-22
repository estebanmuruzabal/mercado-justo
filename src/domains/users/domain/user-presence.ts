import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const ACTIVE_NOW_MS = 2 * 60 * 1000
const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

export function formatLastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Sin actividad reciente'

  const seenAt = new Date(lastSeenAt)
  if (Number.isNaN(seenAt.getTime())) return 'Sin actividad reciente'

  const diffMs = Date.now() - seenAt.getTime()
  if (diffMs < ACTIVE_NOW_MS) return 'Activo ahora'

  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  if (diffMs < ONE_HOUR_MS) {
    return diffMinutes <= 1 ? 'Activo hace 1 minuto' : `Activo hace ${diffMinutes} minutos`
  }

  const diffHours = Math.floor(diffMs / ONE_HOUR_MS)
  if (diffMs < ONE_DAY_MS) {
    return diffHours === 1 ? 'Activo hace 1 hora' : `Activo hace ${diffHours} horas`
  }

  return `Última conexión: ${formatDistanceToNow(seenAt, { addSuffix: true, locale: es })}`
}
