'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/stores/cart-store/cart-store'
import { ListingDetailLocation } from '@/components/marketplace/detail/ListingDetailLocation'

export type ProductVariantDetail = {
  id: string
  name: string
  price: number
  stock: number
  isDefault: boolean
  attributes: Record<string, string>
}

export function ProductDetailClient({
  storeId,
  storeName,
  productTitle,
  productImage,
  latitude,
  longitude,
  variants,
}: {
  storeId: string
  storeName?: string
  productTitle: string
  productImage: string
  latitude: number | null
  longitude: number | null
  variants: ProductVariantDetail[]
}) {
  const { addItem } = useCartStore()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const initialVariantId = useMemo(() => {
    return variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? null
  }, [variants])

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId)
  const [quantity, setQuantity] = useState<number>(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null
    return variants.find((v) => v.id === selectedVariantId) ?? null
  }, [variants, selectedVariantId])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      setCurrentUserId(data.user?.id ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [supabase])

  // Clamp quantity when switching variants.
  // This avoids sending an invalid quantity larger than stock.
  useEffect(() => {
    if (!selectedVariant) return
    setQuantity((q) => {
      const max = selectedVariant.stock > 0 ? selectedVariant.stock : 1
      return Math.max(1, Math.min(q, max))
    })
  }, [selectedVariant])

  const canAdd = Boolean(selectedVariant && selectedVariant.stock > 0 && selectedVariant.price > 0)
  const isSelfSeller = currentUserId != null && currentUserId === storeId

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
      <div className='space-y-4'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={productImage}
          alt={productTitle}
          className='h-[420px] w-full rounded-2xl object-cover'
        />

        <div className='space-y-1'>
          <h1 className='text-2xl font-bold leading-tight'>{productTitle}</h1>
          {selectedVariant ? (
            <div className='text-sm text-muted-foreground'>
              Precio: ${selectedVariant.price} • Stock: {selectedVariant.stock}
            </div>
          ) : null}

          <div className='mt-2 text-sm'>
            <span className='text-muted-foreground'>Vendedor: </span>
            {storeName ? (
              <Link className='font-medium hover:underline' href={`/seller/${storeId}`}>
                {storeName}
              </Link>
            ) : (
              <Link className='font-medium hover:underline' href={`/seller/${storeId}`}>
                Ver perfil del vendedor
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <Card>
          <CardContent className='space-y-3 p-4'>
            <div className='space-y-1'>
              <div className='text-sm font-semibold'>Elegí una variante</div>
              <div className='text-xs text-muted-foreground'>Las variantes disponibles dependen del stock actual.</div>
            </div>

            <div className='grid gap-3'>
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId
                const disabled = v.stock <= 0
                return (
                  <button
                    key={v.id}
                    type='button'
                    className={[
                      'rounded-xl border p-3 text-left transition',
                      isSelected ? 'border-black bg-muted/10' : 'hover:bg-muted/10',
                      disabled ? 'opacity-50' : '',
                    ].join(' ')}
                    onClick={() => {
                      if (disabled) return
                      setSelectedVariantId(v.id)
                    }}
                    aria-disabled={disabled}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='text-sm font-semibold'>{v.name}</div>
                        <div className='text-xs text-muted-foreground'>${v.price}</div>
                        <div className='text-xs text-muted-foreground'>Stock: {v.stock}</div>
                      </div>
                      {v.isDefault ? <div className='text-xs text-muted-foreground'>(default)</div> : null}
                    </div>

                    {Object.keys(v.attributes).length > 0 ? (
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {Object.entries(v.attributes)
                          .slice(0, 6)
                          .map(([k, val]) => (
                            <span
                              key={k}
                              className='rounded-md bg-muted/10 px-2 py-1 text-[11px] text-muted-foreground'
                            >
                              {k}: {val}
                            </span>
                          ))}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className='space-y-3 rounded-xl border bg-background p-4'>
          {isSelfSeller ? (
            <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive'>
              No podés comprar tus propios productos.
            </div>
          ) : null}

          <div className='flex items-center justify-between gap-3'>
            <div className='space-y-0.5'>
              <div className='text-sm font-semibold'>Cantidad</div>
              <div className='text-xs text-muted-foreground'>
                {selectedVariant ? `Disponible: ${selectedVariant.stock}` : ''}
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                disabled={!selectedVariant || isSelfSeller || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <div className='w-10 text-center text-sm font-semibold'>{quantity}</div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                disabled={!selectedVariant || isSelfSeller || (selectedVariant ? quantity >= selectedVariant.stock : true)}
                onClick={() => {
                  if (!selectedVariant) return
                  setQuantity((q) => Math.min(selectedVariant.stock, q + 1))
                }}
              >
                +
              </Button>
            </div>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <Button
              type='button'
              disabled={!canAdd || isSelfSeller}
              onClick={() => {
                if (!selectedVariant) return
                if (isSelfSeller) return
                addItem({
                  listingType: 'product',
                  variantId: selectedVariant.id,
                  storeId,
                  title: productTitle,
                  image: productImage,
                  quantity,
                  unitPrice: selectedVariant.price,
                })
              }}
            >
              Agregar al carrito
            </Button>

            <Button
              type='button'
              disabled={!canAdd || isSelfSeller}
              variant='default'
              onClick={() => {
                if (!selectedVariant) return
                if (isSelfSeller) return
                addItem({
                  listingType: 'product',
                  variantId: selectedVariant.id,
                  storeId,
                  title: productTitle,
                  image: productImage,
                  quantity,
                  unitPrice: selectedVariant.price,
                })
                router.push('/checkout')
              }}
            >
              Comprar ahora
            </Button>
          </div>
        </div>
      </div>
      </div>

      <ListingDetailLocation
        latitude={latitude}
        longitude={longitude}
        title={productTitle}
      />
    </div>
  )
}

