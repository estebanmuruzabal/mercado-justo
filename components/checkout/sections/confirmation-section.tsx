'use client'

import { Ticket, Clock } from 'lucide-react'

import { OrderNoteField } from '../confirmation/order-note-field'

export function ConfirmationSection() {
  return (
    <div className='space-y-4'>
      <p className='text-sm text-neutral-600'>
        Revisá el resumen abajo y confirmá tu compra cuando estés listo.
      </p>

      <OrderNoteField />

      <div className='flex flex-col gap-2 opacity-60'>
        <div className='flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-500'>
          <Ticket className='h-4 w-4 shrink-0' />
          Cupones — Próximamente
        </div>
        <div className='flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-500'>
          <Clock className='h-4 w-4 shrink-0' />
          Horario de entrega — Próximamente
        </div>
      </div>
    </div>
  )
}
