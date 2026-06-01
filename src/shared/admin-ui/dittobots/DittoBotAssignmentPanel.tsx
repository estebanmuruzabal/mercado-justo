'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Truck } from 'lucide-react'

import {
  assignDittoBotUnitsAction,
  setVendorDittoSellerAction,
} from '@/domains/dittobots/application/actions/admin-ditto-bot-inventory.actions'
import type {
  DittoBotProductRow,
  RegionalVendorManageRow,
  RegionalVendorRow,
} from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import type { DittoBotInventoryUnitAdmin } from '@/domains/dittobots/domain/ditto-bot-inventory-unit'
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
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'

export function DittoBotAssignmentPanel({
  availableUnits,
  vendors,
  allVendors,
  products,
}: {
  availableUnits: DittoBotInventoryUnitAdmin[]
  vendors: RegionalVendorRow[]
  allVendors: RegionalVendorManageRow[]
  products: DittoBotProductRow[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [productFilter, setProductFilter] = useState<string>('all')
  const [assignOpen, setAssignOpen] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (productFilter === 'all') return availableUnits
    return availableUnits.filter((u) => u.productId === productFilter)
  }, [availableUnits, productFilter])

  function toggleUnit(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((u) => u.id)))
    }
  }

  async function handleAssign() {
    if (!vendorId || selected.size === 0) return
    setPending(true)
    setError(null)

    const result = await assignDittoBotUnitsAction({
      unitIds: [...selected],
      vendorId,
    })

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setAssignOpen(false)
    setSelected(new Set())
    router.refresh()
  }

  async function handleToggleDittoSeller(vendorIdToToggle: string, enabled: boolean) {
    setPending(true)
    setError(null)
    const result = await setVendorDittoSellerAction({ vendorId: vendorIdToToggle, enabled })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>DittoSeller</CardTitle>
          <CardDescription>
            Solo vendors habilitados como DittoSeller pueden recibir stock asignado y ver Mis DittoBots.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {allVendors.map((vendor) => (
            <div
              key={vendor.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2'
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>{vendor.name}</span>
                <span className='text-xs text-muted-foreground'>({vendor.slug})</span>
                {vendor.canSellDittoBots ? <Badge>DittoSeller</Badge> : null}
              </div>
              <div className='flex items-center gap-2'>
                <Label htmlFor={`ditto-seller-${vendor.id}`} className='text-xs'>
                  DittoSeller
                </Label>
                <Switch
                  id={`ditto-seller-${vendor.id}`}
                  checked={vendor.canSellDittoBots}
                  disabled={pending}
                  onCheckedChange={(checked) =>
                    void handleToggleDittoSeller(vendor.id, checked)
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='Filtrar producto' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los productos</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={selected.size === 0 || vendors.length === 0} onClick={() => setAssignOpen(true)}>
          <Truck className='mr-2 h-4 w-4' />
          Asignar ({selected.size})
        </Button>
      </div>

      {vendors.length === 0 ? (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          No hay vendors habilitados como DittoSeller. Primero habilitá un vendor para vender DittoBots.
        </p>
      ) : null}

      {error ? (
        <p className='text-sm text-destructive' role='alert'>
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Stock disponible para asignar</CardTitle>
          <CardDescription>
            Solo unidades en estado <code>available</code> pueden asignarse a vendors DittoSeller.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[640px] text-sm'>
            <thead>
              <tr className='border-b text-left text-muted-foreground'>
                <th className='py-2 pr-4'>
                  <input
                    type='checkbox'
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    aria-label='Seleccionar todos'
                  />
                </th>
                <th className='py-2 pr-4'>Serial</th>
                <th className='py-2 pr-4'>Producto</th>
                <th className='py-2'>Código</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr key={unit.id} className='border-b'>
                  <td className='py-3 pr-4'>
                    <input
                      type='checkbox'
                      checked={selected.has(unit.id)}
                      onChange={() => toggleUnit(unit.id)}
                      aria-label={`Seleccionar ${unit.serialNumber}`}
                    />
                  </td>
                  <td className='py-3 pr-4 font-mono text-xs'>{unit.serialNumber}</td>
                  <td className='py-3 pr-4'>{unit.productTitle ?? unit.model}</td>
                  <td className='py-3 font-mono text-xs'>{unit.activationCode}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className='py-8 text-center text-muted-foreground'>
                    No hay unidades available para asignar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar a vendor DittoSeller</DialogTitle>
            <DialogDescription>
              {selected.size} unidad{selected.size === 1 ? '' : 'es'} seleccionada
              {selected.size === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2 py-4'>
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder='Seleccionar vendor DittoSeller' />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.slug}) · DittoSeller
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button disabled={pending || !vendorId} onClick={() => void handleAssign()}>
              {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Confirmar asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
