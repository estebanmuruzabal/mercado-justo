'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2, Plus, Search } from 'lucide-react'

import { createDittoBotBatchAction } from '@/domains/dittobots/application/actions/admin-ditto-bot-inventory.actions'
import type { DittoBotProductRow } from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import {
  DITTO_BOT_INVENTORY_STATUSES,
  type DittoBotInventoryStatus,
  type DittoBotInventoryUnitAdmin,
} from '@/domains/dittobots/domain/ditto-bot-inventory-unit'
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

function statusVariant(status: DittoBotInventoryStatus) {
  switch (status) {
    case 'activated':
      return 'default'
    case 'available':
      return 'secondary'
    case 'assigned':
      return 'outline'
    case 'sold':
      return 'outline'
    case 'retired':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function DittoBotInventoryPanel({
  initialUnits,
  products,
}: {
  initialUnits: DittoBotInventoryUnitAdmin[]
  products: DittoBotProductRow[]
}) {
  const router = useRouter()
  const [units] = useState(initialUnits)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchForm, setBatchForm] = useState({ productId: '', quantity: '10', serialPrefix: 'DTB-' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    return units.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (productFilter !== 'all' && u.productId !== productFilter) return false
      if (q && !u.serialNumber.toUpperCase().includes(q)) return false
      return true
    })
  }, [units, search, statusFilter, productFilter])

  async function handleCreateBatch(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const result = await createDittoBotBatchAction({
      productId: batchForm.productId,
      quantity: Number(batchForm.quantity),
      serialPrefix: batchForm.serialPrefix || 'DTB-',
    })

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setBatchOpen(false)
    router.refresh()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-1 flex-wrap gap-2'>
          <div className='relative min-w-[200px] flex-1 max-w-sm'>
            <Search className='absolute top-2.5 left-3 h-4 w-4 text-muted-foreground' />
            <Input
              className='pl-9'
              placeholder='Buscar por serial…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              {DITTO_BOT_INVENTORY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Producto' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setBatchOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Crear lote
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
            Inventario físico
          </CardTitle>
          <CardDescription>
            Unidades generadas por lote con serial DTB-000001 y código de activación.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[1100px] text-sm'>
            <thead>
              <tr className='border-b text-left text-muted-foreground'>
                <th className='py-2 pr-4'>Serial</th>
                <th className='py-2 pr-4'>Producto</th>
                <th className='py-2 pr-4'>Estado</th>
                <th className='py-2 pr-4'>Vendor asignado</th>
                <th className='py-2 pr-4'>Firmware</th>
                <th className='py-2 pr-4'>Código activación</th>
                <th className='py-2 pr-4'>Owner</th>
                <th className='py-2'>Creado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr key={unit.id} className='border-b align-top'>
                  <td className='py-3 pr-4 font-mono text-xs'>{unit.serialNumber}</td>
                  <td className='py-3 pr-4'>{unit.productTitle ?? unit.model}</td>
                  <td className='py-3 pr-4'>
                    <Badge variant={statusVariant(unit.status)}>{unit.status}</Badge>
                  </td>
                  <td className='py-3 pr-4'>{unit.assignedVendorName ?? '—'}</td>
                  <td className='py-3 pr-4'>{unit.firmwareVersion ?? '—'}</td>
                  <td className='py-3 pr-4 font-mono text-xs'>{unit.activationCode}</td>
                  <td className='py-3 pr-4 font-mono text-xs'>
                    {unit.ownerUserId ? unit.ownerUserId.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className='py-3 text-xs text-muted-foreground'>
                    {new Date(unit.createdAt).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className='py-8 text-center text-muted-foreground'>
                    Sin unidades. Creá un lote desde un producto DittoBot.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <form onSubmit={(e) => void handleCreateBatch(e)}>
            <DialogHeader>
              <DialogTitle>Crear lote de inventario</DialogTitle>
              <DialogDescription>
                Genera unidades con serial DTB-000001 y códigos de activación aleatorios.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label>Producto</Label>
                <Select
                  value={batchForm.productId}
                  onValueChange={(v) => setBatchForm((f) => ({ ...f, productId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar producto' />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='quantity'>Cantidad</Label>
                <Input
                  id='quantity'
                  type='number'
                  min={1}
                  max={500}
                  required
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='prefix'>Prefijo serial</Label>
                <Input
                  id='prefix'
                  value={batchForm.serialPrefix}
                  onChange={(e) => setBatchForm((f) => ({ ...f, serialPrefix: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={pending || !batchForm.productId}>
                {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Generar lote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
