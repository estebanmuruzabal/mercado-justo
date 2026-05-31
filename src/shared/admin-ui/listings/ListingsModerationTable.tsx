'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flag, MoreHorizontal, Search } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { StatusBadge } from '@/shared/admin-ui/ui/StatusBadge'
import { LISTING_MODERATION_PRESENTATION } from '@/shared/utils/admin-status-presentation'
import { formatCurrency } from '@/shared/utils/admin-format'
import { type ListingModerationStatus } from '@/domains/logistics/domain/types'
import type { AdminListingRow } from '@/domains/marketplace/listings/application/queries/admin-listings.queries'
import { moderateListingAction } from '@/domains/moderation/application/actions/listing-moderation.actions'

type FilterKey = 'all' | ListingModerationStatus | 'reported'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'hidden', label: 'Ocultos' },
  { key: 'reported', label: 'Reportados' },
]

const TYPE_LABELS: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  property: 'Propiedad',
}

export function ListingsModerationTable({
  listings,
  canModerate,
  storeIdFilter,
}: {
  listings: AdminListingRow[]
  canModerate: boolean
  storeIdFilter?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [decisionTarget, setDecisionTarget] = useState<{
    listing: AdminListingRow
    decision: 'rejected' | 'hidden'
  } | null>(null)
  const [reason, setReason] = useState('')

  const counts = useMemo(() => {
    return {
      all: listings.length,
      pending: listings.filter((l) => l.moderationStatus === 'pending').length,
      approved: listings.filter((l) => l.moderationStatus === 'approved').length,
      rejected: listings.filter((l) => l.moderationStatus === 'rejected').length,
      hidden: listings.filter((l) => l.moderationStatus === 'hidden').length,
      reported: listings.filter((l) => l.reportCount > 0).length,
    } as Record<FilterKey, number>
  }, [listings])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return listings.filter((l) => {
      if (storeIdFilter && l.vendorId !== storeIdFilter) return false
      if (filter === 'reported' && l.reportCount === 0) return false
      if (filter !== 'all' && filter !== 'reported' && l.moderationStatus !== filter) return false
      if (q && !l.title.toLowerCase().includes(q) && !l.vendorName.toLowerCase().includes(q)) return false
      return true
    })
  }, [listings, search, filter, storeIdFilter])

  function moderate(listingId: string, decision: 'approved' | 'rejected' | 'hidden', why?: string) {
    startTransition(async () => {
      const res = await moderateListingAction({ listingId, decision, reason: why })
      if (res.success) {
        toast.success('Moderación aplicada.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'No se pudo moderar.')
      }
    })
  }

  function confirmDecision() {
    if (!decisionTarget) return
    const { listing, decision } = decisionTarget
    const why = reason
    setDecisionTarget(null)
    setReason('')
    moderate(listing.id, decision, why)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type='button'
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {f.label} <span className='opacity-60'>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Buscar por título o vendor...'
          className='pl-9'
        />
      </div>

      <div className='rounded-xl border bg-card'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className='text-right'>Precio</TableHead>
                <TableHead>Moderación</TableHead>
                <TableHead className='text-center'>Reportes</TableHead>
                {canModerate ? <TableHead className='w-10' /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canModerate ? 7 : 6} className='h-24 text-center text-muted-foreground'>
                    No hay productos que coincidan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className='max-w-[240px]'>
                        <div className='truncate font-medium'>{l.title}</div>
                        <div className='text-xs text-muted-foreground'>{TYPE_LABELS[l.listingType] ?? l.listingType}</div>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{l.vendorName}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>{l.categoryName ?? '—'}</TableCell>
                    <TableCell className='text-right tabular-nums'>{formatCurrency(l.price)}</TableCell>
                    <TableCell>
                      <StatusBadge presentation={LISTING_MODERATION_PRESENTATION[l.moderationStatus]} />
                    </TableCell>
                    <TableCell className='text-center'>
                      {l.reportCount > 0 ? (
                        <span className='inline-flex items-center gap-1 text-rose-600'>
                          <Flag className='h-3.5 w-3.5' /> {l.reportCount}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    {canModerate ? (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' disabled={isPending}>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {l.moderationStatus !== 'approved' ? (
                              <DropdownMenuItem onClick={() => moderate(l.id, 'approved')}>
                                Aprobar
                              </DropdownMenuItem>
                            ) : null}
                            {l.moderationStatus !== 'rejected' ? (
                              <DropdownMenuItem
                                className='text-rose-600'
                                onClick={() => {
                                  setDecisionTarget({ listing: l, decision: 'rejected' })
                                  setReason('')
                                }}
                              >
                                Rechazar
                              </DropdownMenuItem>
                            ) : null}
                            {l.moderationStatus !== 'hidden' ? (
                              <DropdownMenuItem
                                className='text-rose-600'
                                onClick={() => {
                                  setDecisionTarget({ listing: l, decision: 'hidden' })
                                  setReason('')
                                }}
                              >
                                Ocultar
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

      <Dialog open={Boolean(decisionTarget)} onOpenChange={(o) => !o && setDecisionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionTarget?.decision === 'rejected' ? 'Rechazar producto' : 'Ocultar producto'}
            </DialogTitle>
            <DialogDescription>
              {decisionTarget ? `"${decisionTarget.listing.title}". Podés dejar un motivo (opcional).` : ''}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Motivo de la decisión...'
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDecisionTarget(null)}>Cancelar</Button>
            <Button variant='destructive' disabled={isPending} onClick={confirmDecision}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
