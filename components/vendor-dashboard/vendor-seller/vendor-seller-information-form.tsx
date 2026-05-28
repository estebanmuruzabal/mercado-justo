'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { UseFormSetValue } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { SellerCoordModeSection } from './SellerCoordModeSection'
import type { VendorSellerInformationFormInput } from './vendor-seller-information-schema'

export function VendorSellerInformationForm({
  form,
  coordMode,
  onCoordModeChange,
  geocoding,
  isPending,
  isDeleting,
  submitLabel,
  onSubmit,
  footerActions,
}: {
  form: UseFormReturn<VendorSellerInformationFormInput>
  coordMode: 'auto' | 'map'
  onCoordModeChange: (mode: 'auto' | 'map') => void
  geocoding: boolean
  isPending: boolean
  isDeleting: boolean
  submitLabel: string
  onSubmit: (values: VendorSellerInformationFormInput) => void
  footerActions?: React.ReactNode
}) {
  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Información pública</CardTitle>
        <CardDescription>Editá el nombre y datos de tu negocio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onSubmit(v))}
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
                    <Input
                      {...field}
                      placeholder='https://instagram.com/miemprendimiento'
                      disabled={isPending || isDeleting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SellerCoordModeSection
              coordMode={coordMode}
              onCoordModeChange={onCoordModeChange}
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
                {isPending ? 'Guardando...' : submitLabel}
              </Button>
              {footerActions}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export type VendorSellerInformationFormSetValue = UseFormSetValue<{
  latitude: string
  longitude: string
}>
