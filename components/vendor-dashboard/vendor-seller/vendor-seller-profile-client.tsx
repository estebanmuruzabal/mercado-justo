'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import type { UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { useToast } from '@/hooks/use-toast'

import type { Store } from '@/types/store'
import { updateSellerProfileAction, deleteSellerModeAction } from '@/server/actions/vendor-seller-profile.actions'
import { useUnsavedChangesWarning } from './use-unsaved-changes-warning'
import { SellerCoordModeSection } from './SellerCoordModeSection'
import { useSellerGeocoding } from './use-seller-geocoding'
import { SellerDeleteModeModal } from './SellerDeleteModeModal'

const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(2, 'El nombre del negocio es requerido.'),
  address: z.string().trim().min(2, 'La dirección es requerida.'),
  instagram: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true
        if (!v.length) return true
        try {
          const url = new URL(v)
          const host = url.hostname.replace(/^www\./, '')
          return host === 'instagram.com' || host.endsWith('.instagram.com')
        } catch {
          return false
        }
      },
      'Instagram inválido. Usá una URL completa de instagram.com (ej: https://instagram.com/miemprendimiento).',
    ),
  latitude: z
    .string()
    .min(1, 'Latitud requerida.')
    .refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= -90 && n <= 90
    }, 'Latitud inválida.'),
  longitude: z
    .string()
    .min(1, 'Longitud requerida.')
    .refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= -180 && n <= 180
    }, 'Longitud inválida.'),
})

type SellerProfileFormInput = z.input<typeof sellerProfileSchema>

export function VendorSellerProfileClient({ initialStore }: { initialStore: Store | null }) {
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const router = useRouter()
  const [storeActive, setStoreActive] = useState(Boolean(initialStore))

  const [coordMode, setCoordMode] = useState<'auto' | 'map'>('auto')

  const [isPending, startTransition] = useTransition()
  const [isDeleting, startTransitionDeleting] = useTransition()

  const form = useForm<SellerProfileFormInput>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: {
      businessName: initialStore?.name ?? '',
      address: initialStore?.address ?? '',
      instagram: initialStore?.instagram ?? '',
      latitude: initialStore?.latitude == null ? '' : String(initialStore.latitude),
      longitude: initialStore?.longitude == null ? '' : String(initialStore.longitude),
    },
  })

  const watchAddress = form.watch('address')
  const { geocoding } = useSellerGeocoding({
    address: watchAddress ?? '',
    coordMode,
    setValue: form.setValue as unknown as UseFormSetValue<{ latitude: string; longitude: string }>,
    toast,
  })

  const isDirty = form.formState.isDirty
  useUnsavedChangesWarning(isDirty && !isPending && !isDeleting)

  async function onSubmit(values: SellerProfileFormInput) {
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

      setStoreActive(true)
      toast({ title: 'Success', description: 'Cambios guardados correctamente.' })
      form.reset(values)
    })
  }

  function openDeleteModal() {
    setDeleteOpen(true)
  }

  async function onDeleteConfirmed() {
    startTransitionDeleting(async () => {
      const result = await deleteSellerModeAction()
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Modo vendedor eliminado', description: 'Tu modo vendedor fue eliminado correctamente.' })
      setDeleteOpen(false)
      router.push('/dashboard-vendor/listings')
    })
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold'>Seller Profile</h1>
        <p className='text-sm text-muted-foreground'>Administra la información pública de tu negocio.</p>
      </div>

      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Información pública</CardTitle>
          <CardDescription>Editá el nombre y datos de tu negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => void onSubmit(v))}
              className='grid gap-4 md:grid-cols-2'
            >
              <FormField
                control={form.control}
                name='businessName'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Nombre del negocio</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Mi tienda' disabled={isPending || isDeleting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Dirección completa' disabled={isPending || isDeleting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='instagram'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Instagram del emprendimiento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='https://instagram.com/miemprendimiento' disabled={isPending || isDeleting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SellerCoordModeSection
                coordMode={coordMode}
                onCoordModeChange={(m) => setCoordMode(m)}
                geocoding={geocoding}
                latitude={form.watch('latitude') ?? ''}
                longitude={form.watch('longitude') ?? ''}
                disabled={isPending || isDeleting}
                onChangeCoords={(p) => {
                  form.setValue('latitude', String(p.latitude), { shouldDirty: true, shouldValidate: true })
                  form.setValue('longitude', String(p.longitude), { shouldDirty: true, shouldValidate: true })
                }}
              />

              <FormField
                control={form.control}
                name='latitude'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode='decimal'
                        placeholder='-34.6037'
                        readOnly={coordMode === 'auto'}
                        disabled={isPending || isDeleting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='longitude'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode='decimal'
                        placeholder='-58.3816'
                        readOnly={coordMode === 'auto'}
                        disabled={isPending || isDeleting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:justify-end'>
                <Button type='submit' disabled={isPending || isDeleting}>
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>

                {storeActive ? (
                  <Button
                    type='button'
                    variant='destructive'
                    disabled={isPending || isDeleting}
                    onClick={openDeleteModal}
                  >
                    Eliminar modo vendedor
                  </Button>
                ) : null}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SellerDeleteModeModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={() => void onDeleteConfirmed()}
      />
    </div>
  )
}

