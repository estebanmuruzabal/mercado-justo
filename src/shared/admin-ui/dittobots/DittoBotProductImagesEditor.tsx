'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { GripVertical, ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { createClient } from '@/shared/database/supabase/client'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils/utils'

const STORE_ASSETS_BUCKET = 'store-assets'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

type DittoBotProductImagesEditorProps = {
  uploadPathPrefix: string
  image: string | null
  images: string[]
  onImageChange: (url: string | null) => void
  onGalleryChange: (urls: string[]) => void
  disabled?: boolean
}

export function DittoBotProductImagesEditor({
  uploadPathPrefix,
  image,
  images,
  onImageChange,
  onGalleryChange,
  disabled,
}: DittoBotProductImagesEditorProps) {
  const { toast } = useToast()
  const primaryInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadFile(file: File): Promise<string | null> {
    if (!ACCEPTED.includes(file.type)) {
      toast({
        title: 'Formato no soportado',
        description: 'Usá JPG, PNG, WEBP o AVIF.',
        variant: 'destructive',
      })
      return null
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Archivo muy grande',
        description: 'El máximo es 5MB.',
        variant: 'destructive',
      })
      return null
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${uploadPathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(STORE_ASSETS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      toast({
        title: 'Error al subir',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handlePrimaryUpload(file: File) {
    const url = await uploadFile(file)
    if (url) onImageChange(url)
  }

  async function handleGalleryUpload(file: File) {
    const url = await uploadFile(file)
    if (url) onGalleryChange([...images, url])
  }

  function moveGalleryItem(index: number, direction: -1 | 1) {
    const next = [...images]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onGalleryChange(next)
  }

  return (
    <div className='space-y-4'>
      <input
        ref={primaryInputRef}
        type='file'
        accept={ACCEPTED.join(',')}
        className='hidden'
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handlePrimaryUpload(file)
          e.target.value = ''
        }}
      />
      <input
        ref={galleryInputRef}
        type='file'
        accept={ACCEPTED.join(',')}
        className='hidden'
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleGalleryUpload(file)
          e.target.value = ''
        }}
      />

      <div className='space-y-2'>
        <Label>Imagen principal</Label>
        <div className='relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border bg-muted/30'>
          {image ? (
            <Image src={image} alt='Imagen principal del producto' fill className='object-cover' sizes='320px' />
          ) : (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
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
            onClick={() => primaryInputRef.current?.click()}
          >
            {image ? 'Cambiar principal' : 'Subir principal'}
          </Button>
          {image ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={disabled || uploading}
              onClick={() => onImageChange(null)}
            >
              <Trash2 className='mr-1 h-4 w-4' />
              Quitar
            </Button>
          ) : null}
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Galería (opcional)</Label>
        <div className='space-y-2'>
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className='flex items-center gap-2 rounded-lg border p-2'>
              <GripVertical className='h-4 w-4 shrink-0 text-muted-foreground' />
              <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md'>
                <Image src={url} alt={`Galería ${index + 1}`} fill className='object-cover' sizes='48px' />
              </div>
              <Input value={url} readOnly className='flex-1 text-xs' />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled || index === 0}
                onClick={() => moveGalleryItem(index, -1)}
                aria-label='Subir orden'
              >
                ↑
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled || index === images.length - 1}
                onClick={() => moveGalleryItem(index, 1)}
                aria-label='Bajar orden'
              >
                ↓
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled}
                onClick={() => onGalleryChange(images.filter((_, i) => i !== index))}
                aria-label='Eliminar imagen'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || uploading}
          onClick={() => galleryInputRef.current?.click()}
        >
          Agregar a galería
        </Button>
        <p className={cn('text-xs text-muted-foreground')}>
          Las imágenes se guardan en el listing/publication (no en la unidad física).
        </p>
      </div>
    </div>
  )
}
