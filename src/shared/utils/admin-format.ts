/** Shared formatting helpers for the admin UI. */

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0)
}

const numberFormatter = new Intl.NumberFormat('es-AR')

export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(value ?? 0)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return 'Sin actividad'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Sin actividad'
  const diffMs = Date.now() - d.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'Recién'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.round(hours / 24)
  return `Hace ${days} d`
}
