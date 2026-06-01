'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/shared/database/supabase/server'
import { PROFILE_DITTOBOTS_PATH } from '@/shared/routing/routes'
import { DittoBotActivationError, normalizeActivationCode, normalizeSerialNumber } from '../../domain/activate-ditto-bot.policy'
import { activateDittoBotViaRpc } from '../../infrastructure/ditto-bot-inventory.repository'

export type DittoBotActionResult =
  | { success: true; unitId: string }
  | { success: false; error: string }

const activateSchema = z.object({
  serialNumber: z.string().trim().min(3, 'Ingresá el número de serie.'),
  activationCode: z.string().trim().min(4, 'Ingresá el código de activación.'),
})

function mapRpcActivationError(message: string): DittoBotActivationError {
  if (message.includes('NOT_FOUND')) {
    return new DittoBotActivationError(
      'No se encontró un dispositivo con ese número de serie.',
      'NOT_FOUND',
    )
  }
  if (message.includes('INVALID_CODE')) {
    return new DittoBotActivationError('El código de activación no es válido.', 'INVALID_CODE')
  }
  if (message.includes('ALREADY_ACTIVATED')) {
    return new DittoBotActivationError('Este dispositivo ya fue activado.', 'ALREADY_ACTIVATED')
  }
  if (message.includes('INVALID_STATUS')) {
    return new DittoBotActivationError(
      'Este dispositivo no está disponible para activación.',
      'INVALID_STATUS',
    )
  }
  if (message.includes('UNAUTHENTICATED')) {
    return new DittoBotActivationError(
      'Debés iniciar sesión para activar un DittoBot.',
      'NOT_FOUND',
    )
  }
  return new DittoBotActivationError(message, 'NOT_FOUND')
}

export async function activateDittoBotAction(
  input: z.input<typeof activateSchema>,
): Promise<DittoBotActionResult> {
  const parsed = activateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Debés iniciar sesión para activar un DittoBot.' }
  }

  try {
    const unitId = await activateDittoBotViaRpc(
      parsed.data.serialNumber,
      parsed.data.activationCode,
    )

    revalidatePath(PROFILE_DITTOBOTS_PATH)
    return { success: true, unitId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('NOT_FOUND') || message.includes('INVALID_CODE') || message.includes('ALREADY_ACTIVATED') || message.includes('INVALID_STATUS') || message.includes('UNAUTHENTICATED')) {
      const mapped = mapRpcActivationError(message)
      return { success: false, error: mapped.message }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo activar el dispositivo.',
    }
  }
}

export { normalizeActivationCode, normalizeSerialNumber }
