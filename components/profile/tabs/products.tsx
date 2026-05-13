'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function Products() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Tus productos</h2>
        <p className="text-sm text-muted-foreground">
          Desde acá podés publicar nuevos listings para tu store.
        </p>
      </div>

      <Button asChild>
        <Link href="/sell">Vender algo</Link>
      </Button>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Aún no mostramos el catálogo desde esta sección. Usá el botón para crear una publicación nueva.
      </div>
    </div>
  )
}