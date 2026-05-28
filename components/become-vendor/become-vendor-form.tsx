'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'
import { broadcastAuthSessionSync } from '@/lib/auth/session-sync'
import { VENDOR_LISTINGS_PATH } from '@/lib/routes'
import { updateSellerProfileAction } from '@/server/actions/vendor-seller-profile.actions'
import {
  VendorSellerInformationForm,
  type VendorSellerInformationFormSetValue,
} from '@/components/vendor-dashboard/vendor-seller/vendor-seller-information-form'
import {
  vendorSellerInformationSchema,
  vendorSellerInformationDefaults,
  type VendorSellerInformationFormInput,
} from '@/components/vendor-dashboard/vendor-seller/vendor-seller-information-schema'
import { useSellerGeocoding } from '@/components/vendor-dashboard/vendor-seller/use-seller-geocoding'

export function BecomeVendorForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [coordMode, setCoordMode] = useState<'auto' | 'map'>('auto')
  const [isPending, startTransition] = useTransition()

  const form = useForm<VendorSellerInformationFormInput>({
    resolver: zodResolver(vendorSellerInformationSchema),
    defaultValues: vendorSellerInformationDefaults(null),
  })

  const watchAddress = form.watch('address')
  const { geocoding } = useSellerGeocoding({
    address: watchAddress ?? '',
    coordMode,
    setValue: form.setValue as unknown as VendorSellerInformationFormSetValue,
    toast,
  })

  function onSubmit(values: VendorSellerInformationFormInput) {
    startTransition(async () => {
      const result = await updateSellerProfileAction({
        businessName: values.businessName,
        address: values.address,
        instagram: values.instagram ?? undefined,
        latitude: values.latitude,
        longitude: values.longitude,
      })

      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({
        title: '¡Ya sos vendedor!',
        description: 'Tu tienda está activa. Podés empezar a publicar productos.',
      })

      broadcastAuthSessionSync()
      router.push(VENDOR_LISTINGS_PATH)
      router.refresh()
    })
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold'>Convertite en vendedor</h1>
        <p className='text-sm text-muted-foreground'>
          Completá los datos de tu negocio para activar tu tienda en Mercado Justo.
        </p>
      </div>

      <VendorSellerInformationForm
        form={form}
        coordMode={coordMode}
        onCoordModeChange={setCoordMode}
        geocoding={geocoding}
        isPending={isPending}
        isDeleting={false}
        submitLabel='Activar modo vendedor'
        onSubmit={onSubmit}
      />
    </div>
  )
}
