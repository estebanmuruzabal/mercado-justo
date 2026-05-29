'use client'

import { Banknote, CreditCard, Landmark } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PaymentMethodId } from '@/lib/checkout/types'
import { useCheckoutStore } from '@/stores/checkout.store'

const METHODS: {
  id: PaymentMethodId
  label: string
  description: string
  icon: typeof Banknote
  disabled?: boolean
  badge?: string
}[] = [
  {
    id: 'cash',
    label: 'Efectivo',
    description: 'Pagás al recibir o al retirar',
    icon: Banknote,
  },
  {
    id: 'transfer',
    label: 'Transferencia',
    description: 'Te enviamos los datos después de confirmar',
    icon: Landmark,
  },
  {
    id: 'card',
    label: 'Tarjeta',
    description: 'Débito y crédito',
    icon: CreditCard,
    disabled: true,
    badge: 'Próximamente',
  },
]

export function PaymentMethodCards({ onSelect }: { onSelect: (method: PaymentMethodId) => void }) {
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod)

  return (
    <div className='space-y-3'>
      {METHODS.map((method) => {
        const Icon = method.icon
        const selected = paymentMethod === method.id && !method.disabled

        return (
          <label
            key={method.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-white p-4 transition-colors',
              method.disabled && 'cursor-not-allowed opacity-60',
              selected ? 'border-[#FF385C] ring-2 ring-[#FF385C]/15' : 'border-neutral-200',
              !method.disabled && !selected && 'hover:border-neutral-300',
            )}
          >
            <input
              type='radio'
              name='payment-method'
              disabled={method.disabled}
              checked={selected}
              onChange={() => {
                if (!method.disabled) onSelect(method.id)
              }}
              className='mt-1 h-4 w-4 accent-[#FF385C]'
            />
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100'>
              <Icon className='h-5 w-5 text-neutral-700' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-neutral-900'>{method.label}</span>
                {method.badge ? (
                  <span className='rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-600'>
                    {method.badge}
                  </span>
                ) : null}
              </span>
              <span className='mt-0.5 block text-sm text-neutral-600'>{method.description}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
