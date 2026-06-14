'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { createClient } from '@/shared/database/supabase/client'
import { useToast } from '@/shared/hooks/use-toast'

const STORE_ASSETS_BUCKET = 'store-assets'
const UPLOAD_PATH_PREFIX = 'admin/product-bases'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function ProductBaseImageUploader({
  imageUrl,
  onImageUrlChange,
  disabled,
}: {
  imageUrl: string | null
  onImageUrlChange: (url: string | null) => void
  disabled?: boolean
}) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast({
        title: 'Formato no soportado',
        description: 'Usá JPG, PNG, WEBP o AVIF.',
        variant: 'destructive',
      })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Archivo muy grande',
        description: 'El máximo es 5MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${UPLOAD_PATH_PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(STORE_ASSETS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(path)
      onImageUrlChange(data.publicUrl)
    } catch (err) {
      toast({
        title: 'Error al subir',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='space-y-2 sm:col-span-2'>
      <Label>Imagen base</Label>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPTED.join(',')}
        className='hidden'
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleUpload(file)
          e.target.value = ''
        }}
      />
      <div className='relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border bg-muted/30'>
        {imageUrl ? (
          <Image src={imageUrl} alt='Imagen base del Product Base' fill className='object-cover' sizes='320px' />
        ) : (
          <div className='flex h-full min-h-32 items-center justify-center text-muted-foreground'>
            <ImagePlus className='h-8 w-8' />
          </div>
        )}
        {uploading ? (
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
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        {imageUrl ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={disabled || uploading}
            onClick={() => onImageUrlChange(null)}
          >
            <Trash2 className='mr-1 h-4 w-4' />
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
