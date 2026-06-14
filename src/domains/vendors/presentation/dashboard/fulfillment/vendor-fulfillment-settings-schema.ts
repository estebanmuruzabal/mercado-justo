import * as z from 'zod'

import { FULFILLMENT_METHOD_CODES } from '@/domains/logistics/domain/types'
import type { VendorFulfillmentConfigurationDto } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'

export const vendorCapabilitiesSchema = z.object({
  enabledMethodCodes: z.array(z.enum(FULFILLMENT_METHOD_CODES)).default([]),
  deliveryRadiusKm: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === '') return true
      const parsed = Number(value)
      return !Number.isNaN(parsed) && parsed >= 0
    }, 'Radio de delivery inválido.'),
  pickupAddress: z.string().trim().max(300, 'La dirección es demasiado larga.').optional(),
  autoUseStoreAddressForPickup: z.boolean().default(true),
})

export const vendorPreferencesSchema = z.object({
  defaultMethodCode: z.enum(FULFILLMENT_METHOD_CODES).nullable().optional(),
  requireBuyerConfirmation: z.boolean().default(false),
  allowSameDayPickup: z.boolean().default(false),
  allowSameDayDelivery: z.boolean().default(false),
  minimumPreparationMinutes: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === '') return true
      const parsed = Number(value)
      return Number.isInteger(parsed) && parsed >= 0
    }, 'Tiempo de preparación inválido.'),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres.').optional(),
})

export const vendorWindowFormSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de inicio inválida.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de fin inválida.'),
})

export type VendorCapabilitiesFormInput = z.input<typeof vendorCapabilitiesSchema>
export type VendorPreferencesFormInput = z.input<typeof vendorPreferencesSchema>
export type VendorWindowFormInput = z.input<typeof vendorWindowFormSchema>

export function vendorCapabilitiesDefaults(
  configuration: VendorFulfillmentConfigurationDto,
): VendorCapabilitiesFormInput {
  const { settings, storeAddress } = configuration

  return {
    enabledMethodCodes: settings.enabledMethodCodes,
    deliveryRadiusKm:
      settings.deliveryRadiusKm != null ? String(settings.deliveryRadiusKm) : undefined,
    pickupAddress: settings.pickupAddress ?? storeAddress ?? '',
    autoUseStoreAddressForPickup: settings.preferences.autoUseStoreAddressForPickup,
  }
}

export function vendorPreferencesDefaults(
  configuration: VendorFulfillmentConfigurationDto,
): VendorPreferencesFormInput {
  const { settings } = configuration

  return {
    defaultMethodCode: settings.defaultMethodCode,
    requireBuyerConfirmation: settings.preferences.requireBuyerConfirmation,
    allowSameDayPickup: settings.preferences.allowSameDayPickup,
    allowSameDayDelivery: settings.preferences.allowSameDayDelivery,
    minimumPreparationMinutes:
      settings.preferences.minimumPreparationMinutes != null
        ? String(settings.preferences.minimumPreparationMinutes)
        : undefined,
    notes: settings.preferences.notes ?? undefined,
  }
}

export function formatWindowRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} — ${endTime.slice(0, 5)}`
}
