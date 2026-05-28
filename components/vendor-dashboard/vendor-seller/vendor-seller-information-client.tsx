'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { broadcastAuthSessionSync } from '@/lib/auth/session-sync'
import { BECOME_VENDOR_PATH } from '@/lib/routes'
import type { Store } from '@/types/store'
import { updateSellerProfileAction, deleteSellerModeAction } from '@/server/actions/vendor-seller-profile.actions'

import { useUnsavedChangesWarning } from './use-unsaved-changes-warning'
import { useSellerGeocoding } from './use-seller-geocoding'
import { SellerDeleteModeModal } from './SellerDeleteModeModal'
import {
  vendorSellerInformationSchema,
  vendorSellerInformationDefaults,
  type VendorSellerInformationFormInput,
} from './vendor-seller-information-schema'
import {
  VendorSellerInformationForm,
  type VendorSellerInformationFormSetValue,
} from './vendor-seller-information-form'

export function VendorSellerInformationClient({ initialStore }: { initialStore: Store }) {
  const { toast } = useToast()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [coordMode, setCoordMode] = useState<'auto' | 'map'>('auto')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startTransitionDeleting] = useTransition()

  const form = useForm<VendorSellerInformationFormInput>({
    resolver: zodResolver(vendorSellerInformationSchema),
    defaultValues: vendorSellerInformationDefaults(initialStore),
  })

  const watchAddress = form.watch('address')
  const { geocoding } = useSellerGeocoding({
    address: watchAddress ?? '',
    coordMode,
    setValue: form.setValue as unknown as VendorSellerInformationFormSetValue,
    toast,
  })

  const isDirty = form.formState.isDirty
  useUnsavedChangesWarning(isDirty && !isPending && !isDeleting)

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

      toast({ title: 'Listo', description: 'Cambios guardados correctamente.' })
      form.reset(values)
    })
  }

  function onDeleteConfirmed() {
    startTransitionDeleting(async () => {
      const result = await deleteSellerModeAction()
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Modo vendedor eliminado', description: 'Tu modo vendedor fue eliminado correctamente.' })
      setDeleteOpen(false)
      broadcastAuthSessionSync()
      router.push(BECOME_VENDOR_PATH)
      router.refresh()
    })
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold'>Información del vendedor</h1>
        <p className='text-sm text-muted-foreground'>Administra la información pública de tu negocio.</p>
      </div>

      <VendorSellerInformationForm
        form={form}
        coordMode={coordMode}
        onCoordModeChange={setCoordMode}
        geocoding={geocoding}
        isPending={isPending}
        isDeleting={isDeleting}
        submitLabel='Guardar cambios'
        onSubmit={onSubmit}
        footerActions={
          <Button
            type='button'
            variant='destructive'
            disabled={isPending || isDeleting}
            onClick={() => setDeleteOpen(true)}
          >
            Eliminar modo vendedor
          </Button>
        }
      />

      <SellerDeleteModeModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={() => void onDeleteConfirmed()}
      />
    </div>
  )
}
