'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { createClient } from '@/shared/database/supabase/client'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils/utils'

const STORE_ASSETS_BUCKET = 'store-assets'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

type StoreImageUploadProps = {
  userId: string
  kind: 'banner' | 'logo'
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function StoreImageUpload({ userId, kind, value, onChange, disabled }: StoreImageUploadProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Formato no soportado', description: 'Usá JPG, PNG, WEBP o AVIF.', variant: 'destructive' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Archivo muy grande', description: 'El máximo es 5MB.', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${kind}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(STORE_ASSETS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(path)
      onChange(data.publicUrl)
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

  const isLogo = kind === 'logo'

  return (
    <div className='space-y-2'>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPTED.join(',')}
        className='hidden'
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <div
        className={cn(
          'group relative overflow-hidden border bg-muted/30',
          isLogo ? 'h-28 w-28 rounded-full' : 'aspect-[3/1] w-full rounded-xl',
        )}
      >
        {value ? (
          <Image
            src={value}
            alt={isLogo ? 'Logo de la tienda' : 'Banner de la tienda'}
            fill
            sizes={isLogo ? '112px' : '(max-width: 768px) 100vw, 720px'}
            className='object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <ImagePlus className='h-6 w-6' />
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
          {uploading ? 'Subiendo...' : value ? 'Cambiar' : 'Subir'}
        </Button>
        {value ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={disabled || uploading}
            onClick={() => onChange(null)}
          >
            <Trash2 className='mr-1 h-4 w-4' />
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
