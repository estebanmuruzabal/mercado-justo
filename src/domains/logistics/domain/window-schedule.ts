export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number]

export const ISO_WEEKDAY_LABELS: Record<IsoWeekday, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

export function isIsoWeekday(value: number): value is IsoWeekday {
  return Number.isInteger(value) && value >= 1 && value <= 7
}

export function formatTimeLabel(value: string): string {
  return value.slice(0, 5)
}

export function buildVendorWindowLabel(dayOfWeek: IsoWeekday, startTime: string, endTime: string): string {
  return `${ISO_WEEKDAY_LABELS[dayOfWeek]} ${formatTimeLabel(startTime)}-${formatTimeLabel(endTime)}`
}

export function buildVendorWindowCode(
  kind: 'pickup' | 'delivery',
  dayOfWeek: IsoWeekday,
  startTime: string,
  endTime: string,
): string {
  const start = formatTimeLabel(startTime).replace(':', '')
  const end = formatTimeLabel(endTime).replace(':', '')
  return `${kind}-d${dayOfWeek}-${start}-${end}`
}

export function compareVendorWindows<T extends { dayOfWeek: IsoWeekday; startTime: string }>(a: T, b: T): number {
  if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
  return a.startTime.localeCompare(b.startTime)
}

export function validateVendorWindowTimes(startTime: string, endTime: string): string | null {
  const start = formatTimeLabel(startTime)
  const end = formatTimeLabel(endTime)
  if (start >= end) {
    return 'La hora de fin debe ser posterior a la hora de inicio.'
  }
  return null
}
