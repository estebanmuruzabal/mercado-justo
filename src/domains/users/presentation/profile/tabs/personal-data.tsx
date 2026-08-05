'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { updateCurrentUserProfileAction } from '@/domains/users/application/actions/profile.actions'
import { ProfileTelegramSection } from './profile-telegram-section'
import type { UserTelegramSettings } from '@/domains/dittobots/domain/vendor-telegram-settings'
import { createClient } from '@/shared/database/supabase/client'
import { useToast } from '@/shared/hooks/use-toast'
import { Button } from '@/shared/ui/button'
import { ProfileAvatarImage } from '@/shared/ui/profile-avatar-image'

type ProfileUser = {
  id: string
  email?: string
  fullName: string | null
  avatarUrl: string | null
  telegramSettings: UserTelegramSettings
  telegramConfigured: boolean
}

const PROFILE_ASSETS_BUCKET = 'store-assets'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function PersonalData({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const { toast } = useToast()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSaving, startSaving] = useTransition()

  async function handleAvatarFile(file: File) {
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast({
        title: 'Formato no soportado',
        description: 'Usá JPG, PNG, WEBP o AVIF.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        title: 'Archivo muy grande',
        description: 'El máximo permitido es 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/profile-avatar-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(PROFILE_ASSETS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(PROFILE_ASSETS_BUCKET).getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      toast({ title: 'Foto cargada', description: 'Guardá los cambios para actualizar el perfil.' })
    } catch (err) {
      console.error('[Profile] avatar upload failed', err)
      toast({
        title: 'No se pudo subir la foto',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startSaving(async () => {
      try {
        const result = await updateCurrentUserProfileAction({
          fullName,
          email,
          avatarUrl,
        })

        if (!result.success) {
          toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' })
          return
        }

        toast({
          title: 'Datos actualizados correctamente',
          description: result.emailChanged
            ? 'Si tu proyecto requiere confirmación, revisá tu correo para validar el nuevo email.'
            : undefined,
        })
        router.refresh()
      } catch (err) {
        console.error('[Profile] submit failed', err)
        toast({
          title: 'No se pudo guardar',
          description: err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
          variant: 'destructive',
        })
      }
    })
  }

  const busy = isSaving || isUploadingAvatar

  return (
    <div className='space-y-6'>
      <form className='space-y-4' onSubmit={handleSubmit}>
        <h2 className='text-xl font-bold'>Datos personales</h2>

        <label className='block space-y-1 text-sm'>
          <span className='font-medium text-neutral-700'>Email</span>
          <input
            className='w-full rounded-md border p-2'
            type='email'
            value={email}
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className='block space-y-1 text-sm'>
          <span className='font-medium text-neutral-700'>Nombre</span>
          <input
            className='w-full rounded-md border p-2'
            value={fullName}
            disabled={busy}
            placeholder='Nombre'
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>

        <div className='space-y-2'>
          <div className='text-sm font-medium text-neutral-700'>Foto</div>
          <input
            ref={avatarInputRef}
            type='file'
            accept={ACCEPTED_AVATAR_TYPES.join(',')}
            className='hidden'
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleAvatarFile(file)
              event.target.value = ''
            }}
          />
          <div className='flex items-center gap-4'>
            <div className='relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted/30 text-muted-foreground'>
              {avatarUrl ? (
                <ProfileAvatarImage src={avatarUrl} alt='Foto de perfil' sizes='80px' />
              ) : (
                <ImagePlus className='h-6 w-6' />
              )}
              {isUploadingAvatar ? (
                <div className='absolute inset-0 flex items-center justify-center bg-background/60'>
                  <Loader2 className='h-5 w-5 animate-spin' />
                </div>
              ) : null}
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={busy}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUrl ? 'Cambiar foto' : 'Subir foto'}
              </Button>
              {avatarUrl ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={busy}
                  onClick={() => setAvatarUrl(null)}
                >
                  <Trash2 className='mr-1 h-4 w-4' />
                  Quitar
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Button type='submit' disabled={busy}>
          {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>

      <ProfileTelegramSection
        initialSettings={user.telegramSettings}
        configured={user.telegramConfigured}
      />
    </div>
  )
}
