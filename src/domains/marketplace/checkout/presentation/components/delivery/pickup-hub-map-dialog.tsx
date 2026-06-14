'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { PickupHub } from '@/domains/marketplace/checkout/domain/checkout/types'

export function PickupHubMapDialog({
  hub,
  open,
  onOpenChange,
}: {
  hub: PickupHub | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!hub) return null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${hub.latitude},${hub.longitude}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{hub.name}</DialogTitle>
          <DialogDescription>
            {hub.address}, {hub.city}, {hub.province}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700'>
          <p>{hub.scheduleLabel}</p>
          <p>Costo: {hub.costLabel}</p>
          <a
            href={mapsUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex font-semibold text-[#FF385C] hover:underline'
          >
            Abrir en Google Maps
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
