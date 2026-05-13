import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Car,
  Home,
  Package,
  Store,
} from "lucide-react"
// import { ListingCreateForm } from '@/components/listings/listing-create-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { fetchCategories } from '@/server/queries/listing.queries'
import { getStoreByUserId } from '@/server/services/store.service'

export default async function SellPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const [categories, store] = await Promise.all([
    fetchCategories(),
    getStoreByUserId(user.id),
  ])

  const categoriesOptions = [
    {
      title: "Productos",
      icon: Package,
    },
    {
      title: "Vehículos",
      icon: Car,
    },
    {
      title: "Inmuebles",
      icon: Home,
    },
    {
      title: "Servicios",
      icon: Store,
    },
  ]

  if (!store) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Activá tu store primero</CardTitle>
            <CardDescription>
              Necesitás tener el modo vendedor activo para publicar productos.
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

 
  
  return (
    <main className="min-h-screen bg-[#ebebeb]">
      {/* HERO */}
      <section className="relative h-[370px] bg-[#fff159]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-16">
          <h1 className="max-w-3xl text-center text-5xl font-semibold leading-tight tracking-tight text-black">
            ¡Hola! Antes que nada contanos,
            <br />
            ¿qué vas a publicar?
          </h1>

          {/* Cards */}
          <div className="absolute bottom-[-90px] flex flex-wrap items-center justify-center gap-6">
            {categoriesOptions.map((category) => {
              const Icon = category.icon

              return (
                <button
                  key={category.title}
                  className="
                    group
                    flex
                    h-[200px]
                    w-[210px]
                    flex-col
                    items-center
                    justify-center
                    rounded-md
                    border
                    border-neutral-200
                    bg-white
                    shadow-sm
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:shadow-md
                  "
                >
                  <div
                    className="
                      mb-6
                      flex
                      h-24
                      w-24
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#fff159]/20
                      transition-all
                      group-hover:bg-[#fff159]/40
                    "
                  >
                    <Icon
                      strokeWidth={1.7}
                      className="h-14 w-14 text-neutral-700"
                    />
                  </div>

                  <span className="text-3xl font-normal text-neutral-700">
                    {category.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="mx-auto max-w-6xl px-6 pt-36">
        <div className="flex items-start gap-4">
          <div
            className="
              mt-1
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white
              shadow-sm
            "
          >
            <Package className="h-5 w-5 text-neutral-700" />
          </div>

          <div className="space-y-1">
            <p className="text-xl text-neutral-700">
              Para subir muchos productos, podés
            </p>

            <button
              className="
                text-xl
                font-medium
                text-[#3483fa]
                transition-colors
                hover:text-blue-700
              "
            >
              ir al Publicador masivo
            </button>
          </div>
        </div>

        <div className="mt-72 text-center text-sm text-neutral-500">
          Asegurate de que tu publicación cumpla con las políticas de la
          plataforma.
        </div>
      </section>

      {/* Floating Button */}
      <button
        className="
          fixed
          bottom-8
          right-8
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-[#3483fa]
          text-white
          shadow-lg
          transition-transform
          hover:scale-105
        "
      >
        ✦
      </button>
    </main>
  )
}

