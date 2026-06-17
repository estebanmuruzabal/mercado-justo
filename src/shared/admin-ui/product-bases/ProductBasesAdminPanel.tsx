'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, PencilLine, Plus, Power, Trash2 } from 'lucide-react'

import type { AdminCategoryRow } from '@/domains/marketplace/categories/application/queries/admin-categories.queries'
import {
  deleteProductBaseAction,
  duplicateProductBaseAction,
  getProductBaseDetailAction,
  setProductBaseStatusAction,
} from '@/domains/marketplace/product-base/application/actions/admin-product-base.actions'
import type {
  ProductBaseDetailDto,
  ProductBaseSummaryDto,
} from '@/domains/marketplace/product-base/application/dto/product-base.dto'
import {
  PRODUCT_BASE_STATUSES,
  PRODUCT_BASE_TYPES,
} from '@/domains/marketplace/product-base/domain/product-base'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

import { ProductBaseFormDialog } from './ProductBaseFormDialog'
import { ProductBaseSourceBadge } from './ProductBaseSourceBadge'

function statusVariant(status: ProductBaseSummaryDto['status']) {
  if (status === 'ACTIVE') return 'default'
  if (status === 'DRAFT') return 'secondary'
  return 'outline'
}

export function ProductBasesAdminPanel({
  initialProductBases,
  categories,
}: {
  initialProductBases: ProductBaseSummaryDto[]
  categories: AdminCategoryRow[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductBaseDetailDto | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return initialProductBases.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (categoryFilter !== 'all' && row.categoryId !== categoryFilter) return false
      if (!search.trim()) return true
      const term = search.trim().toLowerCase()
      return row.name.toLowerCase().includes(term) || row.slug.toLowerCase().includes(term)
    })
  }, [initialProductBases, search, typeFilter, statusFilter, categoryFilter])

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  )

  function refresh() {
    router.refresh()
  }

  async function openEdit(productBaseId: string) {
    setLoadingId(productBaseId)
    setError(null)
    const detail = await getProductBaseDetailAction(productBaseId)
    setLoadingId(null)
    if (!detail) {
      setError('No se pudo cargar el Product Base.')
      return
    }
    setEditing(detail)
    setDialogOpen(true)
  }

  async function handleDuplicate(productBaseId: string) {
    setLoadingId(productBaseId)
    setError(null)
    const result = await duplicateProductBaseAction({ productBaseId })
    setLoadingId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    refresh()
  }

  async function handleStatus(productBaseId: string, status: ProductBaseSummaryDto['status']) {
    setLoadingId(productBaseId)
    setError(null)
    const result = await setProductBaseStatusAction({ productBaseId, status })
    setLoadingId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    refresh()
  }

  async function handleDelete(productBaseId: string) {
    setLoadingId(productBaseId)
    setError(null)
    const result = await deleteProductBaseAction({ productBaseId })
    setLoadingId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    refresh()
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <div>
            <CardTitle>Productos Base</CardTitle>
            <p className='text-sm text-muted-foreground'>
              Plantillas maestras reutilizables para listings del marketplace.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Nuevo Product Base
          </Button>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-3 md:grid-cols-4'>
            <Input
              placeholder='Buscar por nombre o slug'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Tipo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los tipos</SelectItem>
                {PRODUCT_BASE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                {PRODUCT_BASE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Categoría' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todas las categorías</SelectItem>
                {rootCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className='text-sm text-destructive' role='alert'>
              {error}
            </p>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Atributos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const busy = loadingId === row.id
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className='font-medium'>{row.name}</div>
                      <div className='text-xs text-muted-foreground'>{row.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{row.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>{row.categoryName ?? '—'}</div>
                      {row.subcategoryName ? (
                        <div className='text-xs text-muted-foreground'>{row.subcategoryName}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.attributeCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ProductBaseSourceBadge source={row.source} />
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          disabled={busy}
                          onClick={() => void openEdit(row.id)}
                          aria-label='Editar'
                        >
                          {busy ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <PencilLine className='h-4 w-4' />
                          )}
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          disabled={busy}
                          onClick={() => void handleDuplicate(row.id)}
                          aria-label='Duplicar'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                        {row.status !== 'ACTIVE' ? (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled={busy}
                            onClick={() => void handleStatus(row.id, 'ACTIVE')}
                            aria-label='Activar'
                          >
                            <Power className='h-4 w-4' />
                          </Button>
                        ) : (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled={busy}
                            onClick={() => void handleStatus(row.id, 'INACTIVE')}
                            aria-label='Desactivar'
                          >
                            <Power className='h-4 w-4 text-muted-foreground' />
                          </Button>
                        )}
                        {row.status !== 'ACTIVE' ? (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled={busy}
                            onClick={() => void handleDelete(row.id)}
                            aria-label='Eliminar'
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        ) : (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled
                            aria-label='Desactivá antes de eliminar'
                            title='Desactivá antes de eliminar'
                          >
                            <Trash2 className='h-4 w-4 text-muted-foreground/40' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay Product Bases para mostrar.</p>
          ) : null}
        </CardContent>
      </Card>

      <ProductBaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        initial={editing}
        onSaved={refresh}
      />
    </div>
  )
}
