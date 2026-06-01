'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2, Pencil, Plus, Tag } from 'lucide-react'

import {
  createDittoBotProductAction,
  deactivateDittoBotProductAction,
  updateDittoBotProductAction,
} from '@/domains/dittobots/application/actions/admin-ditto-bot-product.actions'
import type { DittoBotProductRow } from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import { DEFAULT_DITTO_BOT_SETTINGS, type DittoBotSettings } from '@/domains/dittobots/domain/ditto-bot-settings'
import { DITTO_BOT_STOCK_INFO_MESSAGE } from '@/domains/dittobots/domain/ditto-bot-product-stock'
import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { DittoBotProductImagesEditor } from '@/shared/admin-ui/dittobots/DittoBotProductImagesEditor'

type ProductForm = {
  title: string
  description: string
  categoryId: string
  price: string
  tags: string
  image: string | null
  images: string[]
  dittoBotSettings: DittoBotSettings
}

const EMPTY_FORM: ProductForm = {
  title: '',
  description: '',
  categoryId: '',
  price: '',
  tags: '',
  image: null,
  images: [],
  dittoBotSettings: DEFAULT_DITTO_BOT_SETTINGS,
}

function productToForm(product: DittoBotProductRow): ProductForm {
  return {
    title: product.title,
    description: product.description ?? '',
    categoryId: product.categoryId,
    price: String(product.price ?? 0),
    tags: product.tags.join(', '),
    image: product.image,
    images: product.images,
    dittoBotSettings: product.dittoBotSettings,
  }
}

export function DittoBotProductsPanel({
  initialProducts,
  categories,
  officialVendorId,
}: {
  initialProducts: DittoBotProductRow[]
  categories: AdminCategoryRow[]
  officialVendorId: string
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const productCategories = useMemo(
    () => categories.filter((c) => c.listingType === 'product'),
    [categories],
  )

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  function categoryNameFor(categoryId: string): string | null {
    return productCategories.find((c) => c.id === categoryId)?.name ?? null
  }

  function rowFromForm(productId: string): DittoBotProductRow {
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    return {
      id: productId,
      title: form.title,
      description: form.description,
      price: Number(form.price),
      stock: 0,
      categoryId: form.categoryId,
      categoryName: categoryNameFor(form.categoryId),
      status: 'published',
      moderationStatus: 'approved',
      tags,
      image: form.image,
      images: form.images,
      dittoBotSettings: form.dittoBotSettings,
      createdAt: new Date().toISOString(),
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(product: DittoBotProductRow) {
    setEditingId(product.id)
    setForm(productToForm(product))
    setError(null)
    setDialogOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      price: Number(form.price),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      image: form.image ?? '',
      images: form.images,
      dittoBotSettings: form.dittoBotSettings,
    }

    const result = editingId
      ? await updateDittoBotProductAction({ productId: editingId, ...payload })
      : await createDittoBotProductAction(payload)

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? rowFromForm(editingId) : p)),
      )
    } else if (result.productId) {
      setProducts((prev) => [rowFromForm(result.productId!), ...prev])
    }

    setDialogOpen(false)
    router.refresh()
  }

  async function handleDeactivate(productId: string) {
    if (!confirm('¿Desactivar este producto DittoBot?')) return
    setPending(true)
    const result = await deactivateDittoBotProductAction({ productId })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    router.refresh()
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <Button onClick={openCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Nuevo producto
        </Button>
      </div>

      {error ? (
        <p className='text-sm text-destructive' role='alert'>
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bot className='h-5 w-5' />
            Catálogo DittoBot
          </CardTitle>
          <CardDescription>
            Productos del vendor oficial con precio centralizado y tags para búsqueda.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[800px] text-sm'>
            <thead>
              <tr className='border-b text-left text-muted-foreground'>
                <th className='py-2 pr-4'>Título</th>
                <th className='py-2 pr-4'>Categoría</th>
                <th className='py-2 pr-4'>Precio</th>
                <th className='py-2 pr-4'>Tags</th>
                <th className='py-2 pr-4'>Estado</th>
                <th className='py-2'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className='border-b align-top'>
                  <td className='py-3 pr-4 font-medium'>{product.title}</td>
                  <td className='py-3 pr-4'>{product.categoryName ?? '—'}</td>
                  <td className='py-3 pr-4'>
                    ${Number(product.price ?? 0).toLocaleString('es-AR')}
                  </td>
                  <td className='py-3 pr-4'>
                    <div className='flex flex-wrap gap-1'>
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant='secondary' className='text-xs'>
                          <Tag className='mr-1 h-3 w-3' />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className='py-3 pr-4'>
                    <Badge variant={product.status === 'published' ? 'default' : 'outline'}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className='py-3'>
                    <div className='flex gap-2'>
                      <Button size='sm' variant='outline' onClick={() => openEdit(product)}>
                        <Pencil className='mr-1 h-3 w-3' />
                        Editar
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        disabled={pending}
                        onClick={() => void handleDeactivate(product.id)}
                      >
                        Desactivar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className='py-8 text-center text-muted-foreground'>
                    Sin productos DittoBot. Creá el primero.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar producto' : 'Nuevo producto DittoBot'}</DialogTitle>
              <DialogDescription>
                listing_type=product, is_ditto_bot=true, price_mode=centralized
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <p className='rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
                {DITTO_BOT_STOCK_INFO_MESSAGE}
              </p>
              <div className='grid gap-2'>
                <Label htmlFor='title'>Título</Label>
                <Input
                  id='title'
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Descripción</Label>
                <Textarea
                  id='description'
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <DittoBotProductImagesEditor
                uploadPathPrefix={`${officialVendorId}/ditto-products`}
                image={form.image}
                images={form.images}
                onImageChange={(url) => setForm((f) => ({ ...f, image: url }))}
                onGalleryChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
                disabled={pending}
              />
              <div className='grid gap-2'>
                <Label>Categoría</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar subcategoría' />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.name}` : cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='price'>Precio</Label>
                <Input
                  id='price'
                  type='number'
                  min={1}
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='tags'>Tags (mín. 1, separados por coma)</Label>
                <Input
                  id='tags'
                  required
                  placeholder='dittobot, hidroponia, sensor'
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
              <div className='space-y-2 rounded-lg border p-3'>
                <p className='text-sm font-medium'>ditto_bot_settings</p>
                {(
                  [
                    ['requiresActivation', 'Requiere activación'],
                    ['autoGenerateSerial', 'Auto serial'],
                    ['autoGenerateActivationCode', 'Auto código activación'],
                    ['supportsOta', 'Soporta OTA'],
                    ['requiresOwner', 'Requiere owner'],
                    ['requiresVendorAssignment', 'Requiere asignación vendor'],
                    ['requiresDeviceLink', 'Requiere link dispositivo'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className='flex items-center justify-between gap-4'>
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={form.dittoBotSettings[key]}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({
                          ...f,
                          dittoBotSettings: { ...f.dittoBotSettings, [key]: checked },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={pending}>
                {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                {editingId ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
