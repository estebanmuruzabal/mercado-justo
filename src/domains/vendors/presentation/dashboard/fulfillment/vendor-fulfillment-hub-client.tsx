'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useToast } from '@/shared/hooks/use-toast'
import { FulfillmentAvailabilityPreview } from '@/domains/logistics/presentation/components/FulfillmentAvailabilityPreview'
import { saveVendorFulfillmentSettingsAction } from '@/domains/vendors/application/actions/vendor-fulfillment.actions'
import type { VendorFulfillmentConfigurationDto } from '@/domains/vendors/application/queries/vendor-fulfillment.queries'

import {
  VendorCapabilitiesForm,
  getEnabledMethodCodes,
} from './vendor-capabilities-form'
import { VendorPreferencesForm } from './vendor-preferences-form'
import { VendorTimeWindowsPanel } from './vendor-time-windows-panel'
import {
  vendorCapabilitiesDefaults,
  vendorCapabilitiesSchema,
  vendorPreferencesDefaults,
  vendorPreferencesSchema,
  type VendorCapabilitiesFormInput,
  type VendorPreferencesFormInput,
} from './vendor-fulfillment-settings-schema'

export function VendorFulfillmentHubClient({
  configuration,
}: {
  configuration: VendorFulfillmentConfigurationDto
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const capabilitiesForm = useForm<VendorCapabilitiesFormInput>({
    resolver: zodResolver(vendorCapabilitiesSchema),
    defaultValues: vendorCapabilitiesDefaults(configuration),
  })

  const preferencesForm = useForm<VendorPreferencesFormInput>({
    resolver: zodResolver(vendorPreferencesSchema),
    defaultValues: vendorPreferencesDefaults(configuration),
  })

  const enabledMethodCodes = capabilitiesForm.watch('enabledMethodCodes') ?? []
  const hasPickup =
    enabledMethodCodes.includes('pickup_seller') ||
    enabledMethodCodes.includes('pickup_dittovan')
  const hasDelivery =
    enabledMethodCodes.includes('delivery_seller') ||
    enabledMethodCodes.includes('delivery_dittovan')

  function saveSettings() {
    startTransition(async () => {
      const capabilities = capabilitiesForm.getValues()
      const preferences = preferencesForm.getValues()
      const deliveryRadiusRaw = capabilities.deliveryRadiusKm?.trim()
      const minimumPrepRaw = preferences.minimumPreparationMinutes?.trim()

      const pickupAddress = capabilities.autoUseStoreAddressForPickup
        ? configuration.storeAddress
        : capabilities.pickupAddress?.trim() || null

      const result = await saveVendorFulfillmentSettingsAction({
        enabledMethodCodes: capabilities.enabledMethodCodes ?? [],
        deliveryRadiusKm:
          deliveryRadiusRaw && deliveryRadiusRaw.length > 0 ? deliveryRadiusRaw : undefined,
        pickupAddress: pickupAddress ?? undefined,
        defaultMethodCode: preferences.defaultMethodCode ?? undefined,
        preferences: {
          autoUseStoreAddressForPickup: capabilities.autoUseStoreAddressForPickup ?? true,
          requireBuyerConfirmation: preferences.requireBuyerConfirmation ?? false,
          allowSameDayPickup: preferences.allowSameDayPickup ?? false,
          allowSameDayDelivery: preferences.allowSameDayDelivery ?? false,
          minimumPreparationMinutes:
            minimumPrepRaw && minimumPrepRaw.length > 0 ? minimumPrepRaw : undefined,
          notes: preferences.notes?.trim() || undefined,
        },
      })

      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({
        title: 'Configuración guardada',
        description: 'Tus capacidades y preferencias quedaron actualizadas.',
      })
      capabilitiesForm.reset(capabilitiesForm.getValues())
      preferencesForm.reset(preferencesForm.getValues())
      router.refresh()
    })
  }

  const settingsDirty =
    capabilitiesForm.formState.isDirty || preferencesForm.formState.isDirty

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold'>Fulfillment</h1>
        <p className='text-sm text-muted-foreground'>
          Modelá cómo opera tu tienda: métodos, ventanas horarias, preferencias y vista previa para
          checkout.
        </p>
      </div>

      <Tabs defaultValue='capabilities' className='space-y-6'>
        <TabsList className='h-auto flex-wrap'>
          <TabsTrigger value='capabilities'>Capacidades</TabsTrigger>
          <TabsTrigger value='windows'>Ventanas horarias</TabsTrigger>
          <TabsTrigger value='preferences'>Preferencias</TabsTrigger>
          <TabsTrigger value='preview'>Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value='capabilities' className='space-y-4'>
          <VendorCapabilitiesForm form={capabilitiesForm} configuration={configuration} />
        </TabsContent>

        <TabsContent value='windows'>
          <VendorTimeWindowsPanel
            configuration={configuration}
            hasPickup={hasPickup}
            hasDelivery={hasDelivery}
          />
        </TabsContent>

        <TabsContent value='preferences' className='space-y-4'>
          <VendorPreferencesForm
            form={preferencesForm}
            configuration={configuration}
            enabledMethodCodes={getEnabledMethodCodes(capabilitiesForm)}
          />
        </TabsContent>

        <TabsContent value='preview' className='space-y-4'>
          <FulfillmentAvailabilityPreview preview={configuration.preview} mode='vendor' />
          <FulfillmentAvailabilityPreview preview={configuration.preview} mode='checkout' />
        </TabsContent>
      </Tabs>

      <div className='flex justify-end border-t pt-4'>
        <Button
          type='button'
          onClick={saveSettings}
          disabled={isPending || !settingsDirty}
        >
          {isPending ? 'Guardando…' : 'Guardar capacidades y preferencias'}
        </Button>
      </div>
    </div>
  )
}
