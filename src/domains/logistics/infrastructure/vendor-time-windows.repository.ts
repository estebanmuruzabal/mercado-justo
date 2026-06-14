import type { createClient } from '@/shared/database/supabase/server'
import {
  buildVendorWindowCode,
  buildVendorWindowLabel,
  compareVendorWindows,
  isIsoWeekday,
  validateVendorWindowTimes,
  type IsoWeekday,
} from '@/domains/logistics/domain/window-schedule'
import type { DeliveryWindowRow, PickupWindowRow } from '@/domains/logistics/domain/types'

type DbClient = Awaited<ReturnType<typeof createClient>>

type VendorWindowDbRow = {
  id: string
  vendor_id: string
  code: string
  label: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  sort_order: number
  is_active: boolean
}

export type UpsertVendorWindowInput = {
  vendorId: string
  dayOfWeek: IsoWeekday
  startTime: string
  endTime: string
  timezone?: string
  isActive?: boolean
}

function mapPickupWindow(row: VendorWindowDbRow): PickupWindowRow {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    code: row.code,
    label: row.label,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

function mapDeliveryWindow(row: VendorWindowDbRow): DeliveryWindowRow {
  return mapPickupWindow(row)
}

function validateWindowInput(input: UpsertVendorWindowInput): string | null {
  if (!isIsoWeekday(input.dayOfWeek)) {
    return 'Seleccioná un día válido.'
  }
  return validateVendorWindowTimes(input.startTime, input.endTime)
}

function buildInsertPayload(kind: 'pickup' | 'delivery', input: UpsertVendorWindowInput) {
  return {
    vendor_id: input.vendorId,
    code: buildVendorWindowCode(kind, input.dayOfWeek, input.startTime, input.endTime),
    label: buildVendorWindowLabel(input.dayOfWeek, input.startTime, input.endTime),
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    timezone: input.timezone ?? 'America/Argentina/Buenos_Aires',
    sort_order: input.dayOfWeek * 100,
    is_active: input.isActive ?? true,
  }
}

async function refreshWindowLabel(
  client: DbClient,
  table: 'pickup_windows' | 'delivery_windows',
  row: VendorWindowDbRow,
) {
  if (!isIsoWeekday(row.day_of_week)) return row
  const label = buildVendorWindowLabel(row.day_of_week, row.start_time, row.end_time)
  if (label === row.label) return row
  const { data, error } = await client
    .from(table)
    .update({ label } as never)
    .eq('id', row.id)
    .eq('vendor_id', row.vendor_id)
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .single()
  if (error) throw error
  return data as VendorWindowDbRow
}

export async function listVendorPickupWindows(
  client: DbClient,
  vendorId: string,
): Promise<PickupWindowRow[]> {
  const { data, error } = await client
    .from('pickup_windows')
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .eq('vendor_id', vendorId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return ((data ?? []) as VendorWindowDbRow[])
    .map(mapPickupWindow)
    .sort((a, b) =>
      compareVendorWindows(
        { dayOfWeek: a.dayOfWeek as IsoWeekday, startTime: a.startTime },
        { dayOfWeek: b.dayOfWeek as IsoWeekday, startTime: b.startTime },
      ),
    )
}

export async function listVendorDeliveryWindows(
  client: DbClient,
  vendorId: string,
): Promise<DeliveryWindowRow[]> {
  const { data, error } = await client
    .from('delivery_windows')
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .eq('vendor_id', vendorId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return ((data ?? []) as VendorWindowDbRow[])
    .map(mapDeliveryWindow)
    .sort((a, b) =>
      compareVendorWindows(
        { dayOfWeek: a.dayOfWeek as IsoWeekday, startTime: a.startTime },
        { dayOfWeek: b.dayOfWeek as IsoWeekday, startTime: b.startTime },
      ),
    )
}

export async function createVendorPickupWindow(
  client: DbClient,
  input: UpsertVendorWindowInput,
): Promise<PickupWindowRow> {
  const validationError = validateWindowInput(input)
  if (validationError) throw new Error(validationError)

  const { data, error } = await client
    .from('pickup_windows')
    .insert(buildInsertPayload('pickup', input) as never)
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .single()

  if (error) throw error
  const refreshed = await refreshWindowLabel(client, 'pickup_windows', data as VendorWindowDbRow)
  return mapPickupWindow(refreshed)
}

export async function createVendorDeliveryWindow(
  client: DbClient,
  input: UpsertVendorWindowInput,
): Promise<DeliveryWindowRow> {
  const validationError = validateWindowInput(input)
  if (validationError) throw new Error(validationError)

  const { data, error } = await client
    .from('delivery_windows')
    .insert(buildInsertPayload('delivery', input) as never)
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .single()

  if (error) throw error
  const refreshed = await refreshWindowLabel(client, 'delivery_windows', data as VendorWindowDbRow)
  return mapDeliveryWindow(refreshed)
}

export async function updateVendorPickupWindow(
  client: DbClient,
  vendorId: string,
  windowId: string,
  input: UpsertVendorWindowInput,
): Promise<PickupWindowRow> {
  const validationError = validateWindowInput(input)
  if (validationError) throw new Error(validationError)

  const { data, error } = await client
    .from('pickup_windows')
    .update({
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      timezone: input.timezone ?? 'America/Argentina/Buenos_Aires',
      code: buildVendorWindowCode('pickup', input.dayOfWeek, input.startTime, input.endTime),
      is_active: input.isActive ?? true,
    } as never)
    .eq('id', windowId)
    .eq('vendor_id', vendorId)
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .single()

  if (error) throw error
  const refreshed = await refreshWindowLabel(client, 'pickup_windows', data as VendorWindowDbRow)
  return mapPickupWindow(refreshed)
}

export async function updateVendorDeliveryWindow(
  client: DbClient,
  vendorId: string,
  windowId: string,
  input: UpsertVendorWindowInput,
): Promise<DeliveryWindowRow> {
  const validationError = validateWindowInput(input)
  if (validationError) throw new Error(validationError)

  const { data, error } = await client
    .from('delivery_windows')
    .update({
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      timezone: input.timezone ?? 'America/Argentina/Buenos_Aires',
      code: buildVendorWindowCode('delivery', input.dayOfWeek, input.startTime, input.endTime),
      is_active: input.isActive ?? true,
    } as never)
    .eq('id', windowId)
    .eq('vendor_id', vendorId)
    .select('id,vendor_id,code,label,day_of_week,start_time,end_time,timezone,sort_order,is_active')
    .single()

  if (error) throw error
  const refreshed = await refreshWindowLabel(client, 'delivery_windows', data as VendorWindowDbRow)
  return mapDeliveryWindow(refreshed)
}

export async function setVendorPickupWindowActive(
  client: DbClient,
  vendorId: string,
  windowId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await client
    .from('pickup_windows')
    .update({ is_active: isActive } as never)
    .eq('id', windowId)
    .eq('vendor_id', vendorId)

  if (error) throw error
}

export async function setVendorDeliveryWindowActive(
  client: DbClient,
  vendorId: string,
  windowId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await client
    .from('delivery_windows')
    .update({ is_active: isActive } as never)
    .eq('id', windowId)
    .eq('vendor_id', vendorId)

  if (error) throw error
}

export function countActiveWindows<T extends { isActive: boolean }>(windows: T[]): number {
  return windows.filter((window) => window.isActive).length
}

export function activeWindowIds<T extends { id: string; isActive: boolean }>(windows: T[]): string[] {
  return windows.filter((window) => window.isActive).map((window) => window.id)
}
