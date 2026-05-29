'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { broadcastAuthSessionSync } from '@/lib/auth/session-sync'
import { BECOME_VENDOR_PATH, publicVendorPath } from '@/lib/routes'
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

export function VendorSellerInformationClient({
  initialStore,
  userId,
}: {
  initialStore: Store
  userId: string
}) {
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
        slug: values.slug,
        bio: values.bio ?? undefined,
        bannerUrl: values.bannerUrl || undefined,
        logoUrl: values.logoUrl || undefined,
        allowFollowers: values.allowFollowers,
        whatsappNumber: values.whatsappNumber ?? undefined,
        showWhatsapp: values.showWhatsapp,
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
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold'>Información de tu tienda</h1>
          <p className='text-sm text-muted-foreground'>Administra la identidad pública de tu negocio.</p>
        </div>
        {initialStore.slug ? (
          <a
            href={publicVendorPath(initialStore.slug)}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent'
          >
            <ExternalLink className='h-4 w-4' />
            Ver tienda pública
          </a>
        ) : null}
      </div>

      <VendorSellerInformationForm
        form={form}
        userId={userId}
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
