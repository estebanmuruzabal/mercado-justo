import { createClient } from '@/shared/database/supabase/server'
import type {
  DeviceLocation,
  DittoBotInventoryStatus,
  DittoBotInventoryUnit,
  DittoBotInventoryUnitAdmin,
  DittoBotInventoryUnitSummary,
  UserLocation,
} from '../domain/ditto-bot-inventory-unit'
import { generateActivationCode, generateDittoBotSerials } from '../domain/ditto-bot-serial'
import { VENDOR_VISIBLE_INVENTORY_STATUSES } from '../domain/ditto-seller.policy'
import {
  aggregateVendorStockFromUnits,
  filterUnitsForVendorStore,
  type VendorStockAggregate,
  type VendorStockUnit,
} from '../domain/vendor-stock.aggregate'

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
  product_id?: string | null
  batch_id?: string | null
  firmware_version?: string | null
  manufacturer_vendor_id?: string | null
  assigned_vendor_id?: string | null
  assigned_at?: string | null
  seller_vendor_id?: string | null
  publication?: { title: string | null } | null
  assigned_vendor?: { name: string | null } | null
}

const USER_SELECT =
  'id, serial_number, model, subtype, status, owner_user_id, activated_at, location_lat, location_lng, location_region, inherits_user_location, is_public_on_map, friendly_name, created_at, updated_at'

const ADMIN_SELECT = `${USER_SELECT}, activation_code`

const ADMIN_EXTENDED_SELECT = `${ADMIN_SELECT}, product_id, batch_id, firmware_version, manufacturer_vendor_id, assigned_vendor_id, assigned_at, seller_vendor_id, publication:product_id(title), assigned_vendor:store!ditto_bot_inventory_unit_assigned_vendor_id_fkey(name)`

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

function mapAdminUnit(row: InventoryRow): DittoBotInventoryUnitAdmin {
  return {
    ...mapUnit(row),
    productId: row.product_id ?? null,
    productTitle: row.publication?.title ?? null,
    batchId: row.batch_id ?? null,
    firmwareVersion: row.firmware_version ?? null,
    manufacturerVendorId: row.manufacturer_vendor_id ?? null,
    assignedVendorId: row.assigned_vendor_id ?? null,
    assignedVendorName: row.assigned_vendor?.name ?? null,
    assignedAt: row.assigned_at ?? null,
    sellerVendorId: row.seller_vendor_id ?? null,
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

export type AdminInventoryFilters = {
  productId?: string
  status?: DittoBotInventoryStatus
  vendorId?: string
  serial?: string
}

export async function listUnitsAdmin(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  filters: AdminInventoryFilters = {},
): Promise<DittoBotInventoryUnitAdmin[]> {
  let query = adminClient
    .from('ditto_bot_inventory_unit')
    .select(ADMIN_EXTENDED_SELECT)
    .order('created_at', { ascending: false })

  if (filters.productId) query = query.eq('product_id', filters.productId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.vendorId) query = query.eq('assigned_vendor_id', filters.vendorId)
  if (filters.serial?.trim()) {
    query = query.ilike('serial_number', `%${filters.serial.trim().toUpperCase()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => mapAdminUnit(row as InventoryRow))
}

export type CreateBatchWithUnitsInput = {
  productId: string
  productTitle: string
  quantity: number
  serialPrefix?: string
  serialStart?: number
  manufacturerVendorId: string
  createdBy?: string
}

export async function createBatchWithUnits(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  input: CreateBatchWithUnitsInput,
): Promise<{ batchId: string; unitIds: string[] }> {
  const prefix = input.serialPrefix?.trim() || 'DTB-'
  const start = input.serialStart ?? 1
  const serials = generateDittoBotSerials({ prefix, start, quantity: input.quantity })

  const { data: batchRow, error: batchError } = await adminClient
    .from('ditto_bot_inventory_batch')
    .insert({
      product_id: input.productId,
      manufacturer_vendor_id: input.manufacturerVendorId,
      quantity: input.quantity,
      serial_prefix: prefix,
      serial_start: start,
      created_by: input.createdBy ?? null,
    } as never)
    .select('id')
    .single()

  if (batchError) throw batchError
  const batchId = (batchRow as { id: string }).id

  const unitsPayload = serials.map((serial) => ({
    serial_number: serial,
    activation_code: generateActivationCode(),
    model: input.productTitle,
    product_id: input.productId,
    batch_id: batchId,
    manufacturer_vendor_id: input.manufacturerVendorId,
    status: 'available' as const,
  }))

  const { data: insertedUnits, error: unitsError } = await adminClient
    .from('ditto_bot_inventory_unit')
    .insert(unitsPayload as never)
    .select('id')

  if (unitsError) throw unitsError

  return {
    batchId,
    unitIds: ((insertedUnits ?? []) as Array<{ id: string }>).map((u) => u.id),
  }
}

export async function assignUnitsToVendor(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  unitIds: string[],
  vendorId: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await adminClient
    .from('ditto_bot_inventory_unit')
    .update({
      assigned_vendor_id: vendorId,
      assigned_at: now,
      status: 'assigned',
      updated_at: now,
    } as never)
    .in('id', unitIds)
    .eq('status', 'available')

  if (error) throw error
}

export async function findUnitsByIdsAdmin(
  adminClient: ReturnType<typeof import('@/shared/database/admin-client').createAdminClient>,
  unitIds: string[],
): Promise<AssignableUnitRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await adminClient
    .from('ditto_bot_inventory_unit')
    .select('id, status')
    .in('id', unitIds)

  if (error) throw error
  return (data ?? []) as AssignableUnitRow[]
}

export type AssignableUnitRow = {
  id: string
  status: string
}

export type VendorInventoryUnitRow = {
  id: string
  serialNumber: string
  status: DittoBotInventoryStatus
  productId: string | null
  productTitle: string | null
  createdAt: string
}

export async function listUnitsForVendor(
  vendorStoreId: string,
  productId?: string,
): Promise<VendorInventoryUnitRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ditto_bot_inventory_unit')
    .select(
      'id, serial_number, status, product_id, assigned_vendor_id, seller_vendor_id, created_at, publication:product_id(title)',
    )
    .or(`assigned_vendor_id.eq.${vendorStoreId},seller_vendor_id.eq.${vendorStoreId}`)
    .in('status', [...VENDOR_VISIBLE_INVENTORY_STATUSES])
    .order('serial_number', { ascending: true })

  if (productId) query = query.eq('product_id', productId)

  const { data, error } = await query
  if (error) throw error

  const mapped = ((data ?? []) as Array<{
    id: string
    serial_number: string
    status: string
    product_id: string | null
    assigned_vendor_id: string | null
    seller_vendor_id: string | null
    created_at: string
    publication?: { title: string | null } | null
  }>).map((row) => ({
    id: row.id,
    serialNumber: row.serial_number,
    status: row.status as DittoBotInventoryStatus,
    productId: row.product_id,
    productTitle: row.publication?.title ?? null,
    assignedVendorId: row.assigned_vendor_id,
    sellerVendorId: row.seller_vendor_id,
    createdAt: row.created_at,
  }))

  return filterUnitsForVendorStore(mapped as VendorStockUnit[], vendorStoreId).map(
    ({ assignedVendorId, sellerVendorId, createdAt, ...unit }) => ({
      ...unit,
      createdAt: createdAt ?? '',
    }),
  )
}

export type { VendorStockAggregate }

export async function aggregateVendorStock(vendorStoreId: string): Promise<VendorStockAggregate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ditto_bot_inventory_unit')
    .select(
      'id, serial_number, status, product_id, assigned_vendor_id, seller_vendor_id, publication:product_id(title)',
    )
    .or(`assigned_vendor_id.eq.${vendorStoreId},seller_vendor_id.eq.${vendorStoreId}`)
    .in('status', [...VENDOR_VISIBLE_INVENTORY_STATUSES])

  if (error) throw error

  const units = filterUnitsForVendorStore(
    ((data ?? []) as Array<{
      id: string
      serial_number: string
      status: string
      product_id: string | null
      assigned_vendor_id: string | null
      seller_vendor_id: string | null
      publication?: { title: string | null } | null
    }>).map((row) => ({
      id: row.id,
      serialNumber: row.serial_number,
      status: row.status as DittoBotInventoryStatus,
      productId: row.product_id,
      productTitle: row.publication?.title ?? null,
      assignedVendorId: row.assigned_vendor_id,
      sellerVendorId: row.seller_vendor_id,
    })),
    vendorStoreId,
  )

  return aggregateVendorStockFromUnits(units)
}
