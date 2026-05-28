'use client'

import { Input } from '@/components/ui/input'
import { useCheckoutStore } from '@/stores/checkout.store'

export function OrderNoteField() {
  const note = useCheckoutStore((s) => s.note)
  const setNote = useCheckoutStore((s) => s.setNote)

  return (
    <div className='space-y-2'>
      <label htmlFor='checkout-note' className='text-xs font-semibold text-neutral-700'>
        Nota para el vendedor (opcional)
      </label>
      <Input
        id='checkout-note'
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder='Ej: timbre no funciona'
        className='rounded-full'
      />
      {/* TODO: persist note via CheckoutMetadata when order schema supports it */}
    </div>
  )
}
