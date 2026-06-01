#!/usr/bin/env node
/**
 * R5.4b — Manual QA closure runner (seed users + Supabase RPC/RLS).
 * Mirrors browser checks 1, 4, 5, 7, 8, 9, 10, 15 against local Supabase.
 */
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const transport = typeof WebSocket === 'undefined' ? ws : undefined

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const BUYER1_ID = '10000000-0000-4000-8000-000000000011'
const BUYER2_ID = '10000000-0000-4000-8000-000000000012'
const ADMIN_ID = '10000000-0000-4000-8000-000000000001'
const PASSWORD = '123456'

const results = {}

function pass(id, detail) {
  results[id] = { status: 'PASS', detail }
}

function fail(id, detail) {
  results[id] = { status: 'FAIL', detail }
}

async function signIn(email) {
  const client = createClient(URL, ANON, {
    auth: { persistSession: false },
    global: transport ? { fetch: globalThis.fetch } : undefined,
    realtime: transport ? { transport } : undefined,
  })
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`signIn ${email}: ${error.message}`)
  return client
}

async function main() {
  const service = createClient(URL, SERVICE, {
    auth: { persistSession: false },
    realtime: transport ? { transport } : undefined,
  })

  const serial = `QAR5${Date.now().toString(36).toUpperCase()}`
  const code = 'QACODE99'

  // Reset QA units for buyers
  await service
    .from('ditto_bot_inventory_unit')
    .delete()
    .like('serial_number', 'QA%')

  // --- CHECK 1: Super Admin inventory ---
  try {
    const admin = await signIn('admin@test.com')
    const {
      data: { user: adminUser },
    } = await admin.auth.getUser()
    const { data: roleRow } = await service.from('user').select('role').eq('id', ADMIN_ID).single()
    const { data: isSuper } = await admin.rpc('is_super_admin')

    const { data: inserted, error: insertErr } = await service
      .from('ditto_bot_inventory_unit')
      .insert({
        serial_number: serial,
        activation_code: code,
        model: 'DittoNode',
        status: 'available',
      })
      .select('id, serial_number')
      .single()

    if (
      adminUser?.id === ADMIN_ID &&
      roleRow?.role === 'super-admin' &&
      isSuper === true &&
      !insertErr &&
      inserted?.serial_number === serial
    ) {
      pass(1, `super-admin role OK; unit ${serial} registered (${inserted.id})`)
    } else {
      fail(1, JSON.stringify({ adminUser: adminUser?.id, role: roleRow?.role, isSuper, insertErr }))
    }
  } catch (e) {
    fail(1, String(e))
  }

  // --- CHECK 4: Common user without DittoBots ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const { data: hasBot } = await buyer1.rpc('has_active_ditto_bot', { p_user_id: BUYER1_ID })
    const { data: ownUnits } = await buyer1
      .from('ditto_bot_inventory_unit')
      .select('id')
      .eq('owner_user_id', BUYER1_ID)

    if (hasBot === false && (ownUnits ?? []).length === 0) {
      pass(4, 'buyer1 has no active DittoBot; grower menu would hide Recetas')
    } else {
      fail(4, `hasBot=${hasBot}, ownUnits=${(ownUnits ?? []).length}`)
    }
  } catch (e) {
    fail(4, String(e))
  }

  // --- CHECK 5: Invalid activation ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const { error } = await buyer1.schema('public').rpc('activate_ditto_bot_unit', {
      p_serial_number: 'NONEXISTENT999',
      p_activation_code: 'WRONGCODE',
    })
    const msg = error?.message ?? ''
    if (msg.includes('NOT_FOUND') || msg.includes('No se encontró')) {
      pass(5, `clear error: ${msg.slice(0, 120)}`)
    } else {
      fail(5, `unexpected: ${msg}`)
    }
  } catch (e) {
    fail(5, String(e))
  }

  let unitId = null

  // --- CHECK 7: Valid activation ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const { data, error } = await buyer1.schema('public').rpc('activate_ditto_bot_unit', {
      p_serial_number: serial,
      p_activation_code: code,
    })
    if (error) throw error
    unitId = data

    const { data: row } = await service
      .from('ditto_bot_inventory_unit')
      .select('owner_user_id, status')
      .eq('id', unitId)
      .single()

    if (row?.owner_user_id === BUYER1_ID && row?.status === 'activated') {
      pass(7, `unit ${unitId} activated for buyer1`)
    } else {
      fail(7, JSON.stringify(row))
    }
  } catch (e) {
    fail(7, String(e))
  }

  // --- CHECK 8: Grower nav / recetas access ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const { data: hasBot } = await buyer1.rpc('has_active_ditto_bot')
    const { data: units } = await buyer1
      .from('ditto_bot_inventory_unit')
      .select('id, status')
      .eq('owner_user_id', BUYER1_ID)
      .eq('status', 'activated')

    if (hasBot === true && (units ?? []).length >= 1) {
      pass(8, 'has_active_ditto_bot=true; /recetas grower gate would allow access')
    } else {
      fail(8, `hasBot=${hasBot}, activated=${(units ?? []).length}`)
    }
  } catch (e) {
    fail(8, String(e))
  }

  // --- CHECK 9: Double activation ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const { error } = await buyer1.schema('public').rpc('activate_ditto_bot_unit', {
      p_serial_number: serial,
      p_activation_code: code,
    })
    const msg = error?.message ?? ''
    if (msg.includes('ALREADY_ACTIVATED') || msg.includes('ya fue activado')) {
      pass(9, `rejected: ${msg.slice(0, 120)}`)
    } else {
      fail(9, `unexpected: ${msg}`)
    }
  } catch (e) {
    fail(9, String(e))
  }

  // --- CHECK 10: Second user theft attempt ---
  try {
    const buyer2 = await signIn('buyer2@test.com')
    const { error } = await buyer2.schema('public').rpc('activate_ditto_bot_unit', {
      p_serial_number: serial,
      p_activation_code: code,
    })
    const msg = error?.message ?? ''
    if (msg.includes('ALREADY_ACTIVATED') || msg.includes('ya fue activado')) {
      pass(10, `rejected: ${msg.slice(0, 120)}`)
    } else {
      fail(10, `unexpected: ${msg}`)
    }
  } catch (e) {
    fail(10, String(e))
  }

  // --- CHECK 15: Location persistence ---
  try {
    const buyer1 = await signIn('buyer1@test.com')
    const newRegion = 'Resistencia QA R5.4b'
    const { error: updateErr } = await buyer1
      .from('ditto_bot_inventory_unit')
      .update({
        location_region: newRegion,
        inherits_user_location: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId)
      .eq('owner_user_id', BUYER1_ID)
      .eq('status', 'activated')

    if (updateErr) throw updateErr

    const { data: persisted } = await buyer1
      .from('ditto_bot_inventory_unit')
      .select('location_region, inherits_user_location')
      .eq('id', unitId)
      .single()

    if (persisted?.location_region === newRegion && persisted?.inherits_user_location === false) {
      pass(15, `location_region persisted: ${newRegion}`)
    } else {
      fail(15, JSON.stringify(persisted))
    }
  } catch (e) {
    fail(15, String(e))
  }

  console.log(JSON.stringify({ serial, unitId, results }, null, 2))

  const failed = Object.values(results).filter((r) => r.status === 'FAIL')
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
