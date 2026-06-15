import type { FulfillmentMethodCode } from '@/domains/logistics/domain/types'
import {
  formatTimeLabel,
  isIsoWeekday,
  ISO_WEEKDAY_LABELS,
  type IsoWeekday,
} from '@/domains/logistics/domain/window-schedule'
import type {
  CheckoutVendorFulfillmentDto,
  CheckoutVendorFulfillmentSelectionDto,
} from '@/domains/logistics/application/dto/checkout-fulfillment.dto'

function methodKind(code: FulfillmentMethodCode): 'pickup' | 'delivery' {
  return code.startsWith('pickup_') ? 'pickup' : 'delivery'
}

export function resolveNextScheduledDate(input: {
  dayOfWeek: IsoWeekday
  minimumPreparationMinutes: number | null
  allowSameDay: boolean
  now?: Date
}): string {
  const now = input.now ?? new Date()
  const minimumMs = (input.minimumPreparationMinutes ?? 0) * 60_000
  const earliest = new Date(now.getTime() + minimumMs)

  for (let offset = 0; offset < 21; offset += 1) {
    const candidate = new Date(earliest)
    candidate.setDate(candidate.getDate() + offset)
    const jsDay = candidate.getDay()
    const isoDay = jsDay === 0 ? 7 : jsDay
    if (isoDay !== input.dayOfWeek) continue

    const isSameDay =
      candidate.getFullYear() === now.getFullYear() &&
      candidate.getMonth() === now.getMonth() &&
      candidate.getDate() === now.getDate()

    if (isSameDay && !input.allowSameDay) continue

    return candidate.toISOString().slice(0, 10)
  }

  const fallback = new Date(earliest)
  fallback.setDate(fallback.getDate() + 1)
  return fallback.toISOString().slice(0, 10)
}

export function windowDayFromLabel(dayLabel: string): IsoWeekday | null {
  const entry = Object.entries(ISO_WEEKDAY_LABELS).find(([, label]) => label === dayLabel)
  if (!entry) return null
  const day = Number(entry[0])
  return isIsoWeekday(day) ? day : null
}

function parseWindowTimes(timeRange: string): { startTime: string; endTime: string } {
  const [start, end] = timeRange.split(' — ')
  return {
    startTime: start ?? '09:00',
    endTime: end ?? '12:00',
  }
}

export function buildDefaultCheckoutSelection(
  vendor: CheckoutVendorFulfillmentDto,
): CheckoutVendorFulfillmentSelectionDto | null {
  const methodCode =
    vendor.defaultMethodCode && vendor.methods.some((method) => method.code === vendor.defaultMethodCode)
      ? vendor.defaultMethodCode
      : vendor.methods[0]?.code

  if (!methodCode) return null

  const windows = methodKind(methodCode) === 'pickup' ? vendor.pickupWindows : vendor.deliveryWindows
  const window = windows[0]
  if (!window) return null

  const dayOfWeek = windowDayFromLabel(window.dayLabel)
  if (!dayOfWeek) return null

  const allowSameDay =
    methodKind(methodCode) === 'pickup'
      ? vendor.preview.preferences.allowSameDayPickup
      : vendor.preview.preferences.allowSameDayDelivery

  const { startTime, endTime } = parseWindowTimes(window.timeRange)

  return {
    vendorId: vendor.vendorId,
    methodCode,
    windowId: window.id,
    scheduledDate: resolveNextScheduledDate({
      dayOfWeek,
      minimumPreparationMinutes: vendor.preview.preferences.minimumPreparationMinutes,
      allowSameDay,
    }),
    startTime,
    endTime,
    pickupAddress: vendor.preview.preferences.pickupAddress,
    deliveryAddress: null,
  }
}

export function validateCheckoutVendorSelection(input: {
  vendor: CheckoutVendorFulfillmentDto
  selection: CheckoutVendorFulfillmentSelectionDto | undefined
  deliveryAddress: string | null
}): string | null {
  const { vendor, selection, deliveryAddress } = input

  if (!vendor.preview.isReadyForCheckout) {
    return `${vendor.vendorName} todavía no tiene fulfillment listo para checkout.`
  }

  if (!selection?.methodCode) {
    return `Elegí cómo querés recibir los productos de ${vendor.vendorName}.`
  }

  const enabledMethod = vendor.methods.find((method) => method.code === selection.methodCode)
  if (!enabledMethod) {
    return `El método seleccionado para ${vendor.vendorName} ya no está disponible.`
  }

  const kind = methodKind(selection.methodCode)
  const windows = kind === 'pickup' ? vendor.pickupWindows : vendor.deliveryWindows
  const window = windows.find((item) => item.id === selection.windowId)
  if (!window) {
    return `Elegí una ventana horaria válida para ${vendor.vendorName}.`
  }

  if (kind === 'delivery') {
    const address = selection.deliveryAddress ?? deliveryAddress
    if (!address?.trim()) {
      return `Completá tu domicilio de entrega para ${vendor.vendorName}.`
    }
  }

  if (kind === 'pickup' && !vendor.preview.preferences.pickupAddress?.trim()) {
    return `${vendor.vendorName} no tiene dirección de pickup configurada.`
  }

  if (!selection.scheduledDate) {
    return `No pudimos calcular una fecha de fulfillment para ${vendor.vendorName}.`
  }

  return null
}

export function validateCheckoutFulfillmentPayload(input: {
  vendors: CheckoutVendorFulfillmentDto[]
  selections: Record<string, CheckoutVendorFulfillmentSelectionDto | undefined>
  deliveryAddress: string | null
}): string[] {
  const errors: string[] = []

  for (const vendor of input.vendors) {
    const error = validateCheckoutVendorSelection({
      vendor,
      selection: input.selections[vendor.vendorId],
      deliveryAddress: input.deliveryAddress,
    })
    if (error) errors.push(error)
  }

  return errors
}

export function normalizeCheckoutSelectionTimes(
  selection: CheckoutVendorFulfillmentSelectionDto,
): CheckoutVendorFulfillmentSelectionDto {
  return {
    vendorId: selection.vendorId,
    methodCode: selection.methodCode,
    windowId: selection.windowId,
    scheduledDate: selection.scheduledDate,
    startTime: formatTimeLabel(
      selection.startTime.length >= 5 ? selection.startTime : `${selection.startTime}:00`,
    ),
    endTime: formatTimeLabel(
      selection.endTime.length >= 5 ? selection.endTime : `${selection.endTime}:00`,
    ),
    pickupAddress: selection.pickupAddress ?? null,
    deliveryAddress: selection.deliveryAddress ?? null,
  }
}

export function isDeliveryMethodCode(code: FulfillmentMethodCode): boolean {
  return methodKind(code) === 'delivery'
}
