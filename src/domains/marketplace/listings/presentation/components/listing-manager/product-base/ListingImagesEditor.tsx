'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import type { PendingListingImage } from '@/domains/marketplace/listings/presentation/utils/pending-listing-image'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/hooks/use-toast'
import { uploadListingImageFiles } from '@/domains/marketplace/listings/presentation/utils/upload-listing-images'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function ListingImagesEditor({
  listingId,
  images,
  pendingImages,
  disabled,
  required,
  onChange,
  onPendingImagesChange,
}: {
  listingId: string | null
  images: string[]
  pendingImages: PendingListingImage[]
  disabled?: boolean
  required?: boolean
  onChange: (images: string[]) => void
  onPendingImagesChange: (pendingImages: PendingListingImage[]) => void
}) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(files: FileList | null) {
    if (!listingId || !files?.length) return

    const nextFiles = Array.from(files)
    const invalidFile = nextFiles.find((file) => !ACCEPTED.includes(file.type) || file.size > MAX_FILE_SIZE)
    if (invalidFile) {
      toast({
        title: 'Imagen no válida',
        description: 'Usá JPG, PNG, WEBP o AVIF de hasta 5MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadListingImageFiles(listingId, nextFiles)
      if (pendingImages.length > 0) {
        onPendingImagesChange([])
      }
      onChange([...images, ...uploaded])
    } catch (err) {
      toast({
        title: 'Error al subir imágenes',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  function removePendingImage(imageId: string) {
    const next = pendingImages.filter((item) => item.id !== imageId)
    const removed = pendingImages.find((item) => item.id === imageId)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onPendingImagesChange(next)
  }

  const hasAnyImages = images.length > 0 || pendingImages.length > 0

  return (
    <div className='space-y-3 rounded-xl border bg-background p-4'>
      <div className='space-y-1'>
        <Label>Imágenes del listing{required ? ' *' : ''}</Label>
        <p className='text-sm text-muted-foreground'>
          Estas imágenes pertenecen a esta publicación y se guardan aparte de la imagen base del Product Base.
        </p>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept={ACCEPTED.join(',')}
        multiple
        className='hidden'
        disabled={disabled || uploading || !listingId}
        onChange={(event) => {
          void handleUpload(event.target.files)
          event.target.value = ''
        }}
      />

      {hasAnyImages ? (
        <div className='grid gap-3 sm:grid-cols-3'>
          {pendingImages.map((image) => (
            <div key={image.id} className='group relative aspect-square overflow-hidden rounded-lg border bg-muted/30'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt={image.name} className='h-full w-full object-cover' />
              <Badge className='absolute left-2 top-2 text-[10px]' variant='secondary'>
                Pendiente
              </Badge>
              <Button
                type='button'
                variant='destructive'
                size='icon'
                className='absolute right-2 top-2 h-8 w-8 opacity-90'
                disabled={disabled || uploading}
                onClick={() => removePendingImage(image.id)}
                aria-label='Quitar imagen pendiente'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}

          {images.map((imageUrl) => (
            <div key={imageUrl} className='group relative aspect-square overflow-hidden rounded-lg border bg-muted/30'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt='Imagen del listing' className='h-full w-full object-cover' />
              <Button
                type='button'
                variant='destructive'
                size='icon'
                className='absolute right-2 top-2 h-8 w-8 opacity-90'
                disabled={disabled || uploading}
                onClick={() => onChange(images.filter((item) => item !== imageUrl))}
                aria-label='Quitar imagen'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground'>
          No hay imágenes subidas para este listing.
        </div>
      )}

      <Button
        type='button'
        variant='outline'
        disabled={disabled || uploading || !listingId}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <ImagePlus className='mr-2 h-4 w-4' />}
        Subir imágenes
      </Button>
    </div>
  )
}
