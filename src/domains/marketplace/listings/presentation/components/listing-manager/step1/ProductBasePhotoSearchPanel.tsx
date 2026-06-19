import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload } from 'lucide-react'

import { validateIdentifyImageFile } from '@/domains/marketplace/product-base/domain/product-base-image-validation'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/utils/utils'

export function ProductBasePhotoSearchPanel({
  disabled,
  isProcessing,
  onFileSelected,
  validationError,
  onValidationError,
}: {
  disabled?: boolean
  isProcessing?: boolean
  onFileSelected: (file: File) => void
  validationError: string | null
  onValidationError: (message: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleFile(file: File | null) {
    onValidationError(null)
    if (!file) return

    const error = validateIdentifyImageFile(file)
    if (error) {
      onValidationError(error)
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    onFileSelected(file)
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <Label>Buscar por foto</Label>
        <p className='text-sm text-muted-foreground'>
          Subí una foto del producto y te mostramos las plantillas más parecidas del catálogo.
        </p>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        className='hidden'
        disabled={disabled || isProcessing}
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      <button
        type='button'
        disabled={disabled || isProcessing}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-8 text-center transition-colors hover:bg-primary/10',
          (disabled || isProcessing) && 'opacity-60',
        )}
      >
        {previewUrl ? (
          <div className='relative size-28 overflow-hidden rounded-lg border bg-background'>
            <Image src={previewUrl} alt='Vista previa' fill className='object-cover' sizes='112px' />
          </div>
        ) : (
          <Upload className='size-8 text-primary' aria-hidden />
        )}

        <span className='text-sm font-medium text-primary'>
          {isProcessing ? 'Procesando…' : 'Seleccionar los archivos a subir'}
        </span>
        <span className='text-xs text-muted-foreground'>JPG, PNG o WEBP · máximo 10 MB</span>

        {isProcessing ? <Loader2 className='size-5 animate-spin text-primary' aria-hidden /> : null}
      </button>

      {validationError ? <p className='text-sm text-destructive'>{validationError}</p> : null}
    </div>
  )
}
