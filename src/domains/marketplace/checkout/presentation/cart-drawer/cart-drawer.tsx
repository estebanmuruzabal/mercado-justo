'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { Separator } from '@/shared/ui/separator'
import { useCartStore } from '@/domains/marketplace/checkout/presentation/stores/cart-store/cart-store'
import { getListingTypeLabel } from '@/domains/marketplace/listings/domain/listing'
import { hasSupabasePublicConfig } from '@/shared/database/supabase/config'
import { createClient } from '@/shared/database/supabase/client'
import { useCheckoutGuard } from '@/domains/auth/presentation/hooks/use-checkout-guard'
import { CheckoutAuthPanel } from '@/domains/auth/presentation/components/checkout-auth-panel'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, itemCount, totalPrice, setQuantity, removeItem } = useCartStore()
  const {
    authPromptOpen,
    setAuthPromptOpen,
    authView,
    setAuthView,
    goToCheckout,
    resetAuthPrompt,
    isCheckingAuth,
  } = useCheckoutGuard()

  const storeIds = useMemo(() => {
    const unique = new Set<string>()
    for (const item of items) unique.add(item.storeId)
    return Array.from(unique)
  }, [items])

  const [storeNames, setStoreNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (storeIds.length === 0) {
      setStoreNames({})
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        // En caso de que env vars no estén disponibles en el runtime del cliente,
        // evitamos que esto rompa el render del cart.
        if (!hasSupabasePublicConfig()) {
          return
        }

        const supabase = createClient()
        const { data, error } = await supabase
          .from('store')
          .select('id, name')
          .in('id', storeIds)

        if (cancelled) return
        if (error) {
          setStoreNames({})
          return
        }

        const next: Record<string, string> = {}
        const rows = (data ?? []) as Array<{ id: string; name: string | null }>
        for (const row of rows) {
          next[String(row.id)] = typeof row.name === 'string' && row.name ? row.name : 'Vendedor'
        }
        setStoreNames(next)
      } catch {
        if (cancelled) return
        setStoreNames({})
      }
    })()

    return () => {
      cancelled = true
    }
  }, [storeIds])

  const groupedByStore = useMemo(() => {
    const by: Record<string, typeof items> = {}
    const order: string[] = []

    for (const item of items) {
      if (!by[item.storeId]) {
        by[item.storeId] = []
        order.push(item.storeId)
      }
      by[item.storeId].push(item)
    }

    return order.map((storeId) => ({
      storeId,
      items: by[storeId] ?? [],
    }))
  }, [items])

  return (
    <>
      <Sheet
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SheetContent side='right' className='w-full sm:max-w-md p-0'>
          <div className='flex h-full flex-col'>
            <SheetHeader className='p-4'>
              <div className='flex items-center justify-between gap-3'>
                <SheetTitle className='flex items-center gap-2'>
                  <ShoppingCart className='size-4' />
                  Tu carrito
                </SheetTitle>
                <button
                  type='button'
                  onClick={onClose}
                  className='rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground'
                  aria-label='Close cart'
                >
                  ✕
                </button>
              </div>
            </SheetHeader>

          <Separator />

          <div className='flex-1'>
            {items.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center gap-2 p-6 text-center'>
                <p className='text-sm text-muted-foreground'>
                  Tu carrito está vacío. Agrega algo que te guste.
                </p>
                <p className='text-xs text-muted-foreground'>Próximamente: quick add, opciones, reservas.</p>
              </div>
            ) : (
              <div className='h-full overflow-y-auto'>
                <div className='space-y-3 p-4'>
                  {groupedByStore.map(({ storeId, items }, idx) => {
                    const storeName = storeNames[storeId] ?? 'Vendedor'
                    return (
                      <div key={storeId}>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-sm font-semibold text-neutral-900'>
                            Productos de{' '}
                            <Link
                              href={`/seller/${storeId}`}
                              className='text-[#FF385C] transition-colors hover:opacity-80 hover:underline'
                            >
                              {storeName}
                            </Link>
                          </h3>
                        </div>

                        <div className='mt-3 space-y-3'>
                          {items.map((item) => (
                            <div key={item.id} className='rounded-2xl border bg-background p-3'>
                              <div className='flex gap-3'>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className='h-14 w-14 rounded-xl object-cover'
                                />

                                <div className='min-w-0 flex-1'>
                                  <div className='flex items-center justify-between gap-2'>
                                    <div className='min-w-0'>
                                      <div className='truncate text-sm font-semibold'>{item.title}</div>
                                      <div className='text-xs text-muted-foreground'>
                                        {getListingTypeLabel(item.listingType)}
                                      </div>
                                    </div>
                                    <div className='text-sm font-semibold'>{formatMoney(item.unitPrice)}</div>
                                  </div>

                                  <div className='mt-3 flex items-center justify-between gap-3'>
                                    <div className='flex items-center gap-2 rounded-full border bg-white/0 px-2 py-1'>
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 rounded-full'
                                        onClick={() =>
                                          setQuantity(
                                            item.listingType,
                                            item.variantId,
                                            Math.max(0, item.quantity - 1),
                                          )
                                        }
                                        aria-label='Decrease quantity'
                                      >
                                        <Minus className='size-4' />
                                      </Button>

                                      <span className='w-6 text-center text-sm font-medium'>{item.quantity}</span>

                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 rounded-full'
                                        onClick={() =>
                                          setQuantity(item.listingType, item.variantId, item.quantity + 1)
                                        }
                                        aria-label='Increase quantity'
                                      >
                                        <Plus className='size-4' />
                                      </Button>
                                    </div>

                                    <div className='text-sm font-semibold'>
                                      {formatMoney(item.unitPrice * item.quantity)}
                                    </div>
                                  </div>

                                  <div className='mt-2 flex justify-end'>
                                    <button
                                      type='button'
                                      className='text-xs text-muted-foreground hover:text-foreground'
                                      onClick={() => removeItem(item.listingType, item.variantId)}
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {idx < groupedByStore.length - 1 ? (
                          <Separator className='my-4' />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className='p-4'>
            <Separator className='mb-3' />
            <div className='mb-4 flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>{itemCount} artículos</span>
              <span className='text-sm font-semibold'>Total: {formatMoney(totalPrice)}</span>
            </div>

            <Button
              type='button'
              className='w-full'
              disabled={items.length === 0 || isCheckingAuth}
              onClick={() => {
                const wentToCheckout = goToCheckout()
                if (wentToCheckout) onClose()
              }}
            >
              {isCheckingAuth ? 'Verificando acceso...' : 'Ir al checkout'}
            </Button>
          </div>
        </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={authPromptOpen}
        onOpenChange={(open) => {
          if (open) {
            setAuthPromptOpen(true)
            return
          }
          resetAuthPrompt()
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {authView === 'signup'
                ? 'Creá tu cuenta'
                : authView === 'signin'
                  ? 'Iniciá sesión'
                  : 'Continuá con tu compra'}
            </DialogTitle>
            <DialogDescription>
              Tu carrito, dirección y forma de entrega se mantienen. Al terminar vas directo al checkout.
            </DialogDescription>
          </DialogHeader>

          <CheckoutAuthPanel
            view={authView}
            onViewChange={setAuthView}
            onAuthenticated={() => {
              resetAuthPrompt()
              onClose()
            }}
          />

          {authView === 'prompt' ? (
            <DialogFooter>
              <Button type='button' variant='ghost' className='w-full' onClick={resetAuthPrompt}>
                Seguir explorando
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}