'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'

import { createListingAction } from '@/server/actions/listing.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryOption } from '@/types/listing'

export function ListingCreateForm({
  categories,
}: {
  categories: CategoryOption[]
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasCategories = categories.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formRef.current) {
      return
    }

    const formData = new FormData(formRef.current)

    startTransition(async () => {
      const result = await createListingAction(formData)

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            placeholder="Ej. Mate artesanal"
            required
            disabled={isPending || !hasCategories}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            placeholder="Contá qué vendés, estado, detalles y beneficios."
            required
            rows={5}
            disabled={isPending || !hasCategories}
            className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue=""
            required
            disabled={isPending || !hasCategories}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condición</Label>
          <select
            id="condition"
            name="condition"
            defaultValue="new"
            disabled={isPending || !hasCategories}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="new">Nuevo</option>
            <option value="used">Usado</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="12000"
            required
            disabled={isPending || !hasCategories}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            placeholder="1"
            required
            disabled={isPending || !hasCategories}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!hasCategories && (
        <p className="text-sm text-muted-foreground">
          No hay categorías cargadas todavía. Cargá categorías antes de publicar.
        </p>
      )}

      <Button type="submit" className="w-full md:w-auto" disabled={isPending || !hasCategories}>
        {isPending ? 'Creando publicación...' : 'Publicar'}
      </Button>
    </form>
  )
}

