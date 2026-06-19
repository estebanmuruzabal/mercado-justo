'use client'

import { useEffect, useState } from 'react'

import type { ProductBaseSearchResultDto } from '@/domains/marketplace/product-base/application/dto/product-base-search.dto'
import type { DraftFormState } from './types'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { DialogFooter } from '@/shared/ui/dialog'

import { ProductBaseNameSearchPanel } from './step1/ProductBaseNameSearchPanel'
import { ProductBasePhotoSearchPanel } from './step1/ProductBasePhotoSearchPanel'
import {
  ProductBaseSearchModeSelector,
  type ProductBaseSearchMode,
} from './step1/ProductBaseSearchModeSelector'
import { ProductBaseSearchResultsList } from './step1/ProductBaseSearchResultsList'
import { useProductBaseNameSearch } from './step1/use-product-base-name-search'
import { useProductBasePhotoIdentify } from './step1/use-product-base-photo-identify'
import { clearIdentificationImageStorage } from '@/domains/marketplace/listings/presentation/utils/listing-identification-image.storage'

export function ListingModalStep1({
  form,
  formError,
  formBusy,
  listingTypeLabel,
  onProductBaseSelect,
  onIdentificationImageCaptured,
  onContinue,
}: {
  form: DraftFormState
  formError: string | null
  formBusy: boolean
  listingTypeLabel: (listingType: DraftFormState['listingType']) => string
  onProductBaseSelect: (result: ProductBaseSearchResultDto) => void
  onIdentificationImageCaptured: (file: File) => void | Promise<void>
  onContinue: () => void
}) {
  const [mode, setMode] = useState<ProductBaseSearchMode>('name')
  const [nameQuery, setNameQuery] = useState('')
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null)
  const [photoResults, setPhotoResults] = useState<ProductBaseSearchResultDto[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)

  const nameSearch = useProductBaseNameSearch(nameQuery, form.listingType, mode === 'name')
  const photoIdentify = useProductBasePhotoIdentify(form.listingType)

  useEffect(() => {
    if (mode !== 'photo') {
      setPhotoResults([])
      setPhotoError(null)
      setPhotoValidationError(null)
      clearIdentificationImageStorage()
    }
  }, [mode])

  function handlePhotoFileSelected(file: File) {
    setPhotoError(null)
    void onIdentificationImageCaptured(file)
    photoIdentify.mutate(file, {
      onSuccess: (results) => setPhotoResults(results),
      onError: (error) => {
        setPhotoResults([])
        setPhotoError(error instanceof Error ? error.message : 'No se pudo identificar el producto.')
      },
    })
  }

  const activeResults = mode === 'name' ? (nameSearch.data ?? []) : photoResults
  const activeError =
    mode === 'name'
      ? nameSearch.error instanceof Error
        ? nameSearch.error.message
        : null
      : photoError

  const selectedId = form.selectedProductBase?.id ?? form.productBaseId

  return (
    <div className='space-y-5 overflow-y-auto px-1'>
      <div className='space-y-2'>
        <h3 className='text-base font-semibold leading-snug'>
          Para publicar más rápido, buscá tu producto en nuestro catálogo
        </h3>
        {form.listingType ? (
          <Badge variant='secondary'>{listingTypeLabel(form.listingType)}</Badge>
        ) : null}
      </div>

      <ProductBaseSearchModeSelector value={mode} onChange={setMode} disabled={formBusy} />

      {mode === 'name' ? (
        <ProductBaseNameSearchPanel query={nameQuery} onQueryChange={setNameQuery} disabled={formBusy} />
      ) : (
        <ProductBasePhotoSearchPanel
          disabled={formBusy}
          isProcessing={photoIdentify.isPending}
          onFileSelected={handlePhotoFileSelected}
          validationError={photoValidationError}
          onValidationError={setPhotoValidationError}
        />
      )}

      <ProductBaseSearchResultsList
        results={activeResults}
        selectedId={selectedId}
        onSelect={onProductBaseSelect}
        isLoading={mode === 'name' && nameSearch.isFetching && nameQuery.trim().length >= 2}
        isProcessing={mode === 'photo' && photoIdentify.isPending}
        error={activeError}
        emptyMessage={
          mode === 'name' && nameQuery.trim().length < 2
            ? 'Escribí al menos 2 caracteres para ver resultados.'
            : undefined
        }
        onRetry={
          mode === 'name'
            ? () => void nameSearch.refetch()
            : photoIdentify.variables
              ? () => handlePhotoFileSelected(photoIdentify.variables as File)
              : undefined
        }
      />

      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <DialogFooter className='sticky bottom-0 bg-background pt-2'>
        <Button
          type='button'
          className='w-full sm:w-auto'
          disabled={!form.productBaseId || formBusy}
          onClick={() => onContinue()}
        >
          {formBusy ? 'Creando borrador…' : 'Continuar'}
        </Button>
      </DialogFooter>
    </div>
  )
}
