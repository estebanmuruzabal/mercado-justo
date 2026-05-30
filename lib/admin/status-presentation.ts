import {
  type ListingModerationStatus,
  type ReportStatus,
  type ShipmentStatus,
  type VendorStatus,
} from '@/lib/admin/types'

export type StatusPresentation = {
  label: string
  /** Soft badge token classes (light bg + readable text). */
  className: string
}

export const SHIPMENT_STATUS_PRESENTATION: Record<ShipmentStatus, StatusPresentation> = {
  pending: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700' },
  preparing: { label: 'Preparando', className: 'bg-blue-50 text-blue-700' },
  ready_for_pickup: { label: 'Lista para pickup', className: 'bg-indigo-50 text-indigo-700' },
  in_transit: { label: 'En tránsito', className: 'bg-amber-50 text-amber-700' },
  delivered: { label: 'Entregada', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelada', className: 'bg-neutral-100 text-neutral-500' },
  incident: { label: 'Incidencia', className: 'bg-rose-50 text-rose-700' },
}

/** Logistic columns/order for the Orders board. */
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  'pending',
  'preparing',
  'ready_for_pickup',
  'in_transit',
  'delivered',
  'cancelled',
  'incident',
]

export const VENDOR_STATUS_PRESENTATION: Record<VendorStatus, StatusPresentation> = {
  active: { label: 'Activo', className: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspendido', className: 'bg-rose-50 text-rose-700' },
  disabled: { label: 'Desactivado', className: 'bg-neutral-100 text-neutral-500' },
}

export const LISTING_MODERATION_PRESENTATION: Record<
  ListingModerationStatus,
  StatusPresentation
> = {
  pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Aprobado', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rechazado', className: 'bg-rose-50 text-rose-700' },
  hidden: { label: 'Oculto', className: 'bg-neutral-100 text-neutral-500' },
}

export const REPORT_STATUS_PRESENTATION: Record<ReportStatus, StatusPresentation> = {
  open: { label: 'Abierto', className: 'bg-rose-50 text-rose-700' },
  reviewing: { label: 'En revisión', className: 'bg-amber-50 text-amber-700' },
  resolved: { label: 'Resuelto', className: 'bg-emerald-50 text-emerald-700' },
  dismissed: { label: 'Descartado', className: 'bg-neutral-100 text-neutral-500' },
}
