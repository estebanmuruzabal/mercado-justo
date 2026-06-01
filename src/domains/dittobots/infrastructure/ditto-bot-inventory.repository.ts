import { createClient } from '@/shared/database/supabase/server'
import type {
  DeviceLocation,
  DittoBotInventoryStatus,
  DittoBotInventoryUnit,
  DittoBotInventoryUnitSummary,
  UserLocation,
} from '../domain/ditto-bot-inventory-unit'

type InventoryRow = {
  id: string
  serial_number: string
  activation_code: string
  model: string
  subtype: string | null
  status: string
  owner_user_id: string | null
  activated_at: string | null
  location_lat: number | null
  location_lng: number | null
  location_region: string | null
  inherits_user_location: boolean
  is_public_on_map: boolean
  friendly_name: string | null
  created_at: string
  updated_at: string
}

const USER_SELECT =
  'id, serial_number, model, subtype, status, owner_user_id, activated_at, location_lat, location_lng, location_region, inherits_user_location, is_public_on_map, friendly_name, created_at, updated_at'

const ADMIN_SELECT = `${USER_SELECT}, activation_code`

function mapLocation(row: Pick<InventoryRow, 'location_lat' | 'location_lng' | 'location_region'>): DeviceLocation {
  return {
    lat: row.location_lat,
    lng: row.location_lng,
    region: row.location_region,
  }
}

function mapUnit(row: InventoryRow): DittoBotInventoryUnit {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    activationCode: row.activation_code,
    model: row.model,
    subtype: row.subtype,
    status: row.status as DittoBotInventoryStatus,
    ownerUserId: row.owner_user_id,
    activatedAt: row.activated_at,
    location: mapLocation(row),
    inheritsUserLocation: row.inherits_user_location,
    isPublicOnMap: row.is_public_on_map,
    friendlyName: row.friendly_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSummary(row: Omit<InventoryRow, 'activation_code'>): DittoBotInventoryUnitSummary {
  const unit = mapUnit({ ...row, activation_code: '' })
  const { activationCode: _ignored, ...summary } = unit
  void _ignored
  return summary
}

export type RegisterDittoBotUnitInput = {
  serialNumber: string
  activationCode: string
  model: string
  subtype?: string | null
  status?: DittoBotInventoryStatus
}

export type UpdateDittoBotStatusInput = {
  unitId: string
  status: DittoBotInventoryStatus
}

export type DeviceSettingsPatch = {
  locationLat?: number | null
  locationLng?: number | null
  locationRegion?: string | null
  inheritsUserLocation?: boolean
  isPublicOnMap?: boolean
  friendlyName?: string | null
}

export type ActivationPatch = {
  ownerUserId: string
  status: 'activated'
  activatedAt: string
  location: DeviceLocation
  inheritsUserLocation: boolean
}

export async function activateDittoBotViaRpc(
  serialNumber: string,
  activationCode: string,
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('public').rpc('activate_ditto_bot_unit', {
    p_serial_number: serialNumber.trim(),
    p_activation_code: activationCode.trim(),
  })

  if (error) throw error
  if (!data) throw new Error('No se pudo activar el dispositivo.')
  return data as string
}

export async function findUnitBySerial(serialNumber: string): Promise<DittoBotInventoryUnit | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select(ADMIN_SELECT)
    .eq('serial_number', serialNumber.trim().toUpperCase())
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapUnit(data as InventoryRow)
}

export async function activateUnit(
  unitId: string,
  patch: ActivationPatch,
): Promise<DittoBotInventoryUnitSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .update({
      owner_user_id: patch.ownerUserId,
      status: patch.status,
      activated_at: patch.activatedAt,
      location_lat: patch.location.lat,
      location_lng: patch.location.lng,
      location_region: patch.location.region,
      inherits_user_location: patch.inheritsUserLocation,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', unitId)
    .select(USER_SELECT)
    .single()

  if (error) throw error
  return mapSummary(data as InventoryRow)
}

export async function listUnitsByOwner(userId: string): Promise<DittoBotInventoryUnitSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select(USER_SELECT)
    .eq('owner_user_id', userId)
    .order('activated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapSummary(row as InventoryRow))
}

export async function listActiveUnitsByOwner(userId: string): Promise<DittoBotInventoryUnitSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select(USER_SELECT)
    .eq('owner_user_id', userId)
    .eq('status', 'activated')
    .order('activated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapSummary(row as InventoryRow))
}

export async function countUnitsByOwner(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId)

  if (error) throw error
  return count ?? 0
}

export async function countActiveUnitsByOwner(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId)
    .eq('status', 'activated')

  if (error) throw error
  return count ?? 0
}

export async function getUnitByIdForOwner(
  unitId: string,
  ownerUserId: string,
): Promise<DittoBotInventoryUnitSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select(USER_SELECT)
    .eq('id', unitId)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapSummary(data as InventoryRow)
}

export async function updateDeviceSettings(
  unitId: string,
  ownerUserId: string,
  patch: DeviceSettingsPatch,
): Promise<DittoBotInventoryUnitSummary> {
  const supabase = await createClient()
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (patch.locationLat !== undefined) updatePayload.location_lat = patch.locationLat
  if (patch.locationLng !== undefined) updatePayload.location_lng = patch.locationLng
  if (patch.locationRegion !== undefined) updatePayload.location_region = patch.locationRegion
  if (patch.inheritsUserLocation !== undefined) {
    updatePayload.inherits_user_location = patch.inheritsUserLocation
  }
  if (patch.isPublicOnMap !== undefined) updatePayload.is_public_on_map = patch.isPublicOnMap
  if (patch.friendlyName !== undefined) updatePayload.friendly_name = patch.friendlyName

  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .update(updatePayload as never)
    .eq('id', unitId)
    .eq('owner_user_id', ownerUserId)
    .eq('status', 'activated')
    .select(USER_SELECT)
    .single()

  if (error) throw error
  return mapSummary(data as InventoryRow)
}

export async function loadUserLocation(userId: string): Promise<UserLocation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user')
    .select('location_lat, location_lng, location_region')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    location_lat: number | null
    location_lng: number | null
    location_region: string | null
  }

  return {
    lat: row.location_lat,
    lng: row.location_lng,
    region: row.location_region,
  }
}

export async function registerUnit(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  input: RegisterDittoBotUnitInput,
): Promise<DittoBotInventoryUnit> {
  const { data, error } = await adminClient
    .from('ditto_bot_inventory_unit')
    .insert({
      serial_number: input.serialNumber.trim().toUpperCase(),
      activation_code: input.activationCode.trim().toUpperCase(),
      model: input.model.trim(),
      subtype: input.subtype?.trim() ?? null,
      status: input.status ?? 'available',
    } as never)
    .select(ADMIN_SELECT)
    .single()

  if (error) throw error
  return mapUnit(data as InventoryRow)
}

export async function listAllUnitsAdmin(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  searchSerial?: string,
): Promise<DittoBotInventoryUnit[]> {
  let query = adminClient
    .from('ditto_bot_inventory_unit')
    .select(ADMIN_SELECT)
    .order('created_at', { ascending: false })

  if (searchSerial?.trim()) {
    query = query.ilike('serial_number', `%${searchSerial.trim().toUpperCase()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => mapUnit(row as InventoryRow))
}

export async function updateUnitStatusAdmin(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  input: UpdateDittoBotStatusInput,
): Promise<DittoBotInventoryUnit> {
  const { data, error } = await adminClient
    .from('ditto_bot_inventory_unit')
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', input.unitId)
    .select(ADMIN_SELECT)
    .single()

  if (error) throw error
  return mapUnit(data as InventoryRow)
}
