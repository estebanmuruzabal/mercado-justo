'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Loader2, Plus, Search } from 'lucide-react'

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
import {
  registerDittoBotUnitAction,
  updateDittoBotStatusAction,
} from '@/domains/dittobots/application/actions/admin-ditto-bot-inventory.actions'
import {
  DITTO_BOT_INVENTORY_STATUSES,
  type DittoBotInventoryStatus,
  type DittoBotInventoryUnit,
} from '@/domains/dittobots/domain/ditto-bot-inventory-unit'

type RegisterForm = {
  serialNumber: string
  activationCode: string
  model: string
  subtype: string
  status: DittoBotInventoryStatus
}

const EMPTY_REGISTER: RegisterForm = {
  serialNumber: '',
  activationCode: '',
  model: '',
  subtype: '',
  status: 'available',
}

function statusVariant(status: DittoBotInventoryStatus) {
  switch (status) {
    case 'activated':
      return 'default'
    case 'available':
      return 'secondary'
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
}: {
  initialUnits: DittoBotInventoryUnit[]
}) {
  const router = useRouter()
  const [units, setUnits] = useState(initialUnits)
  const [search, setSearch] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState<RegisterForm>(EMPTY_REGISTER)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return units
    return units.filter((u) => u.serialNumber.toUpperCase().includes(q))
  }, [units, search])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const result = await registerDittoBotUnitAction({
      serialNumber: registerForm.serialNumber,
      activationCode: registerForm.activationCode,
      model: registerForm.model,
      subtype: registerForm.subtype || null,
      status: registerForm.status,
    })

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setRegisterOpen(false)
    setRegisterForm(EMPTY_REGISTER)
    router.refresh()
  }

  async function handleStatusChange(unitId: string, status: DittoBotInventoryStatus) {
    setPending(true)
    const result = await updateDittoBotStatusAction({ unitId, status })
    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status } : u)))
    router.refresh()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute top-2.5 left-3 h-4 w-4 text-muted-foreground' />
          <Input
            className='pl-9'
            placeholder='Buscar por serial…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Registrar unidad
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
            Inventario
          </CardTitle>
          <CardDescription>
            Super Admin ve ubicación, owner, estado y visibilidad por dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[960px] text-sm'>
            <thead>
              <tr className='border-b text-left text-muted-foreground'>
                <th className='py-2 pr-4'>Serial</th>
                <th className='py-2 pr-4'>Modelo</th>
                <th className='py-2 pr-4'>Estado</th>
                <th className='py-2 pr-4'>Región</th>
                <th className='py-2 pr-4'>Mapa público</th>
                <th className='py-2 pr-4'>Owner</th>
                <th className='py-2 pr-4'>Activado</th>
                <th className='py-2'>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr key={unit.id} className='border-b align-top'>
                  <td className='py-3 pr-4 font-mono text-xs'>{unit.serialNumber}</td>
                  <td className='py-3 pr-4'>
                    {unit.model}
                    {unit.subtype ? (
                      <span className='block text-xs text-muted-foreground'>{unit.subtype}</span>
                    ) : null}
                  </td>
                  <td className='py-3 pr-4'>
                    <Select
                      value={unit.status}
                      disabled={pending}
                      onValueChange={(v) =>
                        void handleStatusChange(unit.id, v as DittoBotInventoryStatus)
                      }
                    >
                      <SelectTrigger className='h-8 w-[130px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DITTO_BOT_INVENTORY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant={statusVariant(unit.status)} className='mt-1'>
                      {unit.status}
                    </Badge>
                  </td>
                  <td className='py-3 pr-4'>{unit.location.region ?? '—'}</td>
                  <td className='py-3 pr-4'>{unit.isPublicOnMap ? 'Sí' : 'No'}</td>
                  <td className='py-3 pr-4 font-mono text-xs'>
                    {unit.ownerUserId ? unit.ownerUserId.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className='py-3 pr-4 text-xs'>
                    {unit.activatedAt ? new Date(unit.activatedAt).toLocaleString('es-AR') : '—'}
                  </td>
                  <td className='py-3 text-xs text-muted-foreground'>
                    {unit.location.lat != null && unit.location.lng != null
                      ? `${unit.location.lat}, ${unit.location.lng}`
                      : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className='py-8 text-center text-muted-foreground'>
                    Sin unidades registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <form onSubmit={(e) => void handleRegister(e)}>
            <DialogHeader>
              <DialogTitle>Registrar DittoBot</DialogTitle>
              <DialogDescription>
                Crea una unidad de inventario con serial y código de activación.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='serial'>Número de serie</Label>
                <Input
                  id='serial'
                  required
                  value={registerForm.serialNumber}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, serialNumber: e.target.value }))
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='code'>Código de activación</Label>
                <Input
                  id='code'
                  required
                  value={registerForm.activationCode}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, activationCode: e.target.value }))
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='model'>Modelo</Label>
                <Input
                  id='model'
                  required
                  value={registerForm.model}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='subtype'>Subtipo (opcional)</Label>
                <Input
                  id='subtype'
                  value={registerForm.subtype}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, subtype: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={pending}>
                {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
