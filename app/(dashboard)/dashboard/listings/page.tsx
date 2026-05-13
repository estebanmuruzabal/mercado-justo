import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getListingsByStore } from '@/server/services/listing.service'
import { getStoreByUserId } from '@/server/services/store.service'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(price)
}

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const store = await getStoreByUserId(user.id)

  if (!store) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>No tenés un store activo</CardTitle>
            <CardDescription>
              Activá el modo vendedor para empezar a publicar productos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile">Ir al perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const listings = await getListingsByStore(user.id)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis publicaciones</h1>
          <p className="text-sm text-muted-foreground">
            Administrá tus listings activas desde esta sección.
          </p>
        </div>

        <Button asChild>
          <Link href="/sell">Vender algo</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tenés publicaciones todavía</CardTitle>
            <CardDescription>
              Creá tu primera listing para empezar a vender.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/sell">Vender algo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3 text-lg">
                  <span>{listing.title}</span>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {formatPrice(listing.price)}
                  </span>
                </CardTitle>
                <CardDescription className="max-h-12 overflow-hidden">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1 capitalize">
                  {listing.condition}
                </span>
                <span>Stock: {listing.stock}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

