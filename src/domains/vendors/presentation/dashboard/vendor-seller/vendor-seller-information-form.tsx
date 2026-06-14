'use client'

import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { UseFormSetValue } from 'react-hook-form'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Switch } from '@/shared/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { slugify } from '@/domains/vendors/domain/slug'

import { SellerCoordModeSection } from './SellerCoordModeSection'
import { StoreImageUpload } from './store-image-upload'
import type { VendorSellerInformationFormInput } from './vendor-seller-information-schema'

export function VendorSellerInformationForm({
  form,
  userId,
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
  userId: string
  coordMode: 'auto' | 'map'
  onCoordModeChange: (mode: 'auto' | 'map') => void
  geocoding: boolean
  isPending: boolean
  isDeleting: boolean
  submitLabel: string
  onSubmit: (values: VendorSellerInformationFormInput) => void
  footerActions?: React.ReactNode
}) {
  const disabled = isPending || isDeleting
  const slugEdited = useRef(false)
  const businessName = form.watch('businessName')
  const slug = form.watch('slug')

  // Auto-derive the slug from the store name until the user edits it manually.
  useEffect(() => {
    if (slugEdited.current) return
    const next = slugify(businessName || '')
    if (next !== form.getValues('slug')) {
      form.setValue('slug', next, { shouldValidate: true })
    }
  }, [businessName, form])

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Información de tu tienda</CardTitle>
        <CardDescription>Editá la identidad pública de tu negocio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className='grid gap-5 md:grid-cols-2'>
            {/* Banner + logo */}
            <div className='space-y-2 md:col-span-2'>
              <FormLabel>Banner</FormLabel>
              <StoreImageUpload
                userId={userId}
                kind='banner'
                value={form.watch('bannerUrl') || null}
                onChange={(url) => form.setValue('bannerUrl', url ?? '', { shouldDirty: true })}
                disabled={disabled}
              />
              <p className='text-xs text-muted-foreground'>Recomendado 1500×500px. Se muestra como portada.</p>
            </div>

            <div className='space-y-2 md:col-span-2'>
              <FormLabel>Logo</FormLabel>
              <StoreImageUpload
                userId={userId}
                kind='logo'
                value={form.watch('logoUrl') || null}
                onChange={(url) => form.setValue('logoUrl', url ?? '', { shouldDirty: true })}
                disabled={disabled}
              />
              <p className='text-xs text-muted-foreground'>Se muestra circular sobre el banner.</p>
            </div>

            <FormField
              control={form.control}
              name='businessName'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Nombre de la tienda</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='The Tree Kings' disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Slug de la tienda</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='the-tree-kings'
                      disabled={disabled}
                      onChange={(e) => {
                        slugEdited.current = true
                        field.onChange(slugify(e.target.value))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Tu URL pública:{' '}
                    <span className='font-medium text-foreground'>/vendor/{slug || 'tu-tienda'}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder='Contá brevemente qué ofrece tu tienda.'
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='allowFollowers'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between gap-4 rounded-lg border p-4 md:col-span-2'>
                  <div className='space-y-0.5'>
                    <FormLabel>Permitir seguidores</FormLabel>
                    <FormDescription>Los clientes podrán seguir tu tienda.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) =>
                        form.setValue('allowFollowers', checked, { shouldDirty: true })
                      }
                      disabled={disabled}
                      aria-label='Permitir seguidores'
                    />
                  </FormControl>
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
                    <Input {...field} placeholder='Dirección completa' disabled={disabled} />
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
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='whatsappNumber'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Número de WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode='tel'
                      placeholder='5493624123456'
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription>
                    Con código de país, sin el signo + ni espacios. Se usa para el botón{' '}
                    <span className='font-medium text-foreground'>wa.me</span>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='showWhatsapp'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between gap-4 rounded-lg border p-4 md:col-span-2'>
                  <div className='space-y-0.5'>
                    <FormLabel>Mostrar WhatsApp en el perfil</FormLabel>
                    <FormDescription>Mostrá un botón de contacto directo en tu tienda pública.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) =>
                        form.setValue('showWhatsapp', checked, { shouldDirty: true })
                      }
                      disabled={disabled}
                      aria-label='Mostrar WhatsApp en el perfil'
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SellerCoordModeSection
              coordMode={coordMode}
              onCoordModeChange={onCoordModeChange}
              geocoding={geocoding}
              latitude={form.watch('latitude') ?? ''}
              longitude={form.watch('longitude') ?? ''}
              disabled={disabled}
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
                      disabled={disabled}
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
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:justify-end'>
              <Button type='submit' disabled={disabled}>
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
