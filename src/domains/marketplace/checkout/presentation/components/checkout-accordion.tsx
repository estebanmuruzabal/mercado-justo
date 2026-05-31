'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/shared/utils/utils'
import type { CheckoutSectionId, CheckoutSectionVisualState } from '@/domains/marketplace/checkout/domain/checkout/types'

import { CheckoutSectionHeader } from './checkout-section-header'

const SECTION_TITLES: Record<CheckoutSectionId, string> = {
  cart: 'Tu pedido',
  delivery: 'Forma de entrega',
  payment: 'Método de pago',
  confirmation: 'Confirmación final',
}

export function CheckoutAccordionSection({
  sectionId,
  state,
  summary,
  errors,
  disabled,
  onToggle,
  children,
}: {
  sectionId: CheckoutSectionId
  state: CheckoutSectionVisualState
  summary: string | null
  errors: string[]
  disabled?: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const isEditing = state === 'editing'

  return (
    <section className='space-y-2'>
      <CheckoutSectionHeader
        title={SECTION_TITLES[sectionId]}
        state={state}
        summary={summary}
        disabled={disabled}
        onToggle={onToggle}
      />

      <AnimatePresence initial={false}>
        {isEditing ? (
          <motion.div
            key='content'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className='overflow-hidden'
          >
            <div className={cn('rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4')}>
              {children}
              {errors.length > 0 ? (
                <ul className='mt-3 space-y-1'>
                  {errors.map((err) => (
                    <li key={err} className='text-sm text-red-600'>
                      {err}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
