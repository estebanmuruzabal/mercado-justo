'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ExternalLink, MoreHorizontal, Search } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import { VENDOR_STATUS_PRESENTATION } from '@/lib/admin/status-presentation'
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/admin/format'
import { VENDOR_STATUSES, type VendorStatus } from '@/lib/admin/types'
import { publicVendorPath } from '@/lib/routes'
import type { AdminVendorRow } from '@/server/queries/admin/vendors.queries'
import {
  approveVendorAction,
  disableVendorAction,
  reactivateVendorAction,
  suspendVendorAction,
} from '@/server/actions/admin/vendor.actions'

export type VendorCapabilities = {
  canApprove: boolean
  canSuspend: boolean
  canDisable: boolean
}

export function VendorsTable({
  vendors,
  capabilities,
}: {
  vendors: AdminVendorRow[]
  capabilities: VendorCapabilities
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all')
  const [suspendTarget, setSuspendTarget] = useState<AdminVendorRow | null>(null)
  const [reason, setReason] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vendors.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (q && !v.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [vendors, search, statusFilter])

  const hasActions = capabilities.canApprove || capabilities.canSuspend || capabilities.canDisable

  function run(action: () => Promise<{ success: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await action()
      if (res.success) {
        toast.success(okMsg)
        router.refresh()
      } else {
        toast.error(res.error ?? 'No se pudo completar la acción.')
      }
    })
  }

  function confirmSuspend() {
    if (!suspendTarget) return
    const target = suspendTarget
    const value = reason
    setSuspendTarget(null)
    setReason('')
    run(() => suspendVendorAction({ vendorId: target.id, reason: value }), 'Vendor suspendido.')
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar vendor...'
            className='pl-9'
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | VendorStatus)}>
          <SelectTrigger className='w-full sm:w-48'>
            <SelectValue placeholder='Estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los estados</SelectItem>
            {VENDOR_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {VENDOR_STATUS_PRESENTATION[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-xl border bg-card'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-right'>Rating</TableHead>
                <TableHead className='text-right'>Ventas</TableHead>
                <TableHead className='text-right'>Problemas</TableHead>
                <TableHead>Última actividad</TableHead>
                {hasActions ? <TableHead className='w-10' /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 7 : 6} className='h-24 text-center text-muted-foreground'>
                    No hay vendors que coincidan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-9 w-9'>
                          {v.logoUrl ? <AvatarImage src={v.logoUrl} alt={v.name} /> : null}
                          <AvatarFallback>{v.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                          <div className='truncate font-medium'>{v.name}</div>
                          {v.suspensionReason ? (
                            <div className='truncate text-xs text-rose-600'>{v.suspensionReason}</div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge presentation={VENDOR_STATUS_PRESENTATION[v.status]} />
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {v.rating > 0 ? `${v.rating.toFixed(1)} (${v.reviewCount})` : '—'}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      <div>{formatCurrency(v.salesTotal)}</div>
                      <div className='text-xs text-muted-foreground'>{formatNumber(v.salesCount)} pedidos</div>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {v.problems > 0 ? (
                        <span className='font-medium text-rose-600'>{v.problems}</span>
                      ) : (
                        <span className='text-muted-foreground'>0</span>
                      )}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatRelativeTime(v.lastActiveAt)}
                    </TableCell>
                    {hasActions ? (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' disabled={isPending}>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {v.slug ? (
                              <DropdownMenuItem asChild>
                                <Link href={publicVendorPath(v.slug)} target='_blank'>
                                  <ExternalLink className='mr-2 h-4 w-4' /> Ver perfil
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities.canApprove && v.status !== 'active' ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  run(
                                    () =>
                                      v.status === 'suspended' || v.status === 'disabled'
                                        ? reactivateVendorAction(v.id)
                                        : approveVendorAction(v.id),
                                    'Vendor activado.',
                                  )
                                }
                              >
                                {v.status === 'pending' ? 'Aprobar' : 'Reactivar'}
                              </DropdownMenuItem>
                            ) : null}
                            {(capabilities.canApprove || capabilities.canSuspend || capabilities.canDisable) &&
                            v.slug ? (
                              <DropdownMenuSeparator />
                            ) : null}
                            {capabilities.canSuspend && v.status !== 'suspended' ? (
                              <DropdownMenuItem
                                className='text-rose-600'
                                onClick={() => {
                                  setSuspendTarget(v)
                                  setReason('')
                                }}
                              >
                                Suspender
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities.canDisable && v.status !== 'disabled' ? (
                              <DropdownMenuItem
                                className='text-rose-600'
                                onClick={() => run(() => disableVendorAction(v.id), 'Vendor desactivado.')}
                              >
                                Desactivar
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(suspendTarget)} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender vendor</DialogTitle>
            <DialogDescription>
              {suspendTarget ? `Vas a suspender a "${suspendTarget.name}". Indicá el motivo.` : ''}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Motivo de la suspensión...'
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setSuspendTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant='destructive'
              disabled={reason.trim().length < 3 || isPending}
              onClick={confirmSuspend}
            >
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
