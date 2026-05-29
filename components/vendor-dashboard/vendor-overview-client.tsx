'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, Package, ShoppingBag, Store } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  VENDOR_CATEGORIES_PATH,
  VENDOR_DASHBOARD_PATH,
  VENDOR_LISTINGS_PATH,
  VENDOR_SALES_PATH,
  VENDOR_SELLER_PATH,
  VENDOR_STORE_CREATED_PARAM,
} from '@/lib/routes'

const QUICK_LINKS = [
  { href: VENDOR_LISTINGS_PATH, label: 'Mis listings', description: 'Publicá y gestioná productos', icon: Package },
  { href: VENDOR_SALES_PATH, label: 'Ventas', description: 'Revisá pedidos y entregas', icon: ShoppingBag },
  { href: VENDOR_SELLER_PATH, label: 'Información del vendedor', description: 'Datos de tu tienda', icon: Store },
  { href: VENDOR_CATEGORIES_PATH, label: 'Categorías', description: 'Organizá tu catálogo', icon: LayoutGrid },
] as const

export function VendorOverviewClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showWelcome = searchParams.get(VENDOR_STORE_CREATED_PARAM) === '1'
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome)

  useEffect(() => {
    setWelcomeOpen(showWelcome)
  }, [showWelcome])

  function dismissWelcome() {
    setWelcomeOpen(false)
    if (showWelcome) {
      router.replace(VENDOR_DASHBOARD_PATH)
    }
  }

  return (
    <>
      <Dialog
        open={welcomeOpen}
        onOpenChange={(open) => {
          setWelcomeOpen(open)
          if (!open) dismissWelcome()
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>¡Creaste tu tienda exitosamente!</DialogTitle>
            <DialogDescription>
              Desde aquí vas a poder operar tu negocio en Mercado Justo: publicar productos, ver ventas y
              gestionar tu tienda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' onClick={dismissWelcome}>
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='space-y-8'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold'>Overview</h1>
          <p className='text-sm text-muted-foreground'>
            Resumen de tu panel vendedor. Elegí una sección para empezar a operar.
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className='rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50'
              >
                <div className='flex items-start gap-3'>
                  <Icon className='mt-0.5 h-5 w-5 text-muted-foreground' />
                  <div className='space-y-1'>
                    <p className='font-medium'>{item.label}</p>
                    <p className='text-sm text-muted-foreground'>{item.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
