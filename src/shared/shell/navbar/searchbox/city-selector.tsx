'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useUserLocation } from '@/shared/maps/location/presentation/hooks/use-user-location'

const RESISTENCIA = 'Resistencia, Chaco' as const

function isInvalidDestination(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return false
  return trimmed !== RESISTENCIA
}

export function CitySelector({
  buttonLabel = 'Tu ciudad',
  disabled,
  variant = 'standalone',
}: {
  buttonLabel?: string
  disabled?: boolean
  variant?: 'standalone' | 'searchbar' | 'modal'
}) {
  if (variant === 'modal') {
    return <CitySelectorModal />
  }

  return (
    <CitySelectorDropdown buttonLabel={buttonLabel} disabled={disabled} variant={variant} />
  )
}

function CitySelectorDropdown({
  buttonLabel,
  disabled,
  variant,
}: {
  buttonLabel: string
  disabled?: boolean
  variant: 'standalone' | 'searchbar'
}) {
  const { setCity, requestBrowserLocation, status } = useUserLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const inputId = useId()

  const invalid = useMemo(() => isInvalidDestination(query), [query])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (dropdownRef.current && dropdownRef.current.contains(t)) return
      if (triggerRef.current && triggerRef.current.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      requestAnimationFrame(() => triggerRef.current?.focus())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const el = dropdownRef.current?.querySelector<HTMLInputElement>('input[data-destination-search]')
      el?.focus()
    })
  }, [open])

  const onSelectResistencia = () => {
    setCity(RESISTENCIA)
    setOpen(false)
    setQuery(RESISTENCIA)
    requestBrowserLocation()
  }

  return (
    <div className='relative'>
      <motion.button
        ref={triggerRef}
        type='button'
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        whileHover={disabled ? undefined : { y: -1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }}
        className={
          variant === 'searchbar'
            ? 'flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2 text-left transition-colors hover:bg-neutral-50'
            : 'flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-3 text-left transition-colors hover:bg-neutral-50'
        }
        aria-haspopup='dialog'
        aria-expanded={open}
      >
        <span className='text-xs font-semibold text-neutral-900'>Destino</span>
        <span className='truncate text-sm font-semibold text-neutral-900'>{buttonLabel}</span>
        {status === 'requesting' ? (
          <span className='ml-auto text-xs text-neutral-400'>Buscando ubicación...</span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className='fixed inset-0 z-40'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              ref={dropdownRef}
              className='absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] ring-1 ring-black/5'
              role='dialog'
              aria-modal='false'
              initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 6, scale: 0.98, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
            >
              <div className='flex items-center justify-between px-4 py-3'>
                <div className='flex flex-col'>
                  <span className='text-sm font-semibold text-neutral-900'>Elegí una ciudad</span>
                  <span className='text-xs text-neutral-500'>Solo una opción por ahora</span>
                </div>
              </div>

              <div className='px-4 pb-4'>
                <label htmlFor={inputId} className='sr-only'>
                  Buscar destino
                </label>
                <div className='flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3'>
                  <Search className='h-4 w-4 text-neutral-700' />
                  <input
                    id={inputId}
                    data-destination-search
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Escribí un destino (futuro)'
                    className='w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none'
                  />
                </div>

                <div className='mt-3'>
                  <motion.button
                    type='button'
                    onClick={onSelectResistencia}
                    className='flex w-full items-center justify-between rounded-2xl bg-[#FF385C] px-4 py-3 text-white shadow-[0_8px_24px_rgba(255,56,92,0.18)]'
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
                  >
                    <span className='text-sm font-semibold'>{RESISTENCIA}</span>
                    <span className='text-xs font-semibold opacity-90' aria-hidden='true'>
                      Usar ubicación
                    </span>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {invalid ? (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }}
                      className='mt-3 text-xs font-medium text-neutral-500'
                    >
                      No llegamos ahí por ahora, disculpe las molestias.
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function CitySelectorModal() {
  const { setCity, requestBrowserLocation, status } = useUserLocation()
  const [manualQuery, setManualQuery] = useState('')

  const invalid = useMemo(() => isInvalidDestination(manualQuery), [manualQuery])

  const onSelectResistencia = () => {
    setCity(RESISTENCIA)
    requestBrowserLocation()
  }

  return (
    <div className='space-y-2'>
      <motion.button
        type='button'
        onClick={onSelectResistencia}
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
        className='w-full rounded-2xl bg-white border border-neutral-200 px-4 py-4 text-left'
        aria-label={`Seleccionar ${RESISTENCIA}`}
      >
        <div className='flex items-start gap-3'>
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-50 text-lg' aria-hidden='true'>
            🏙️
          </span>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold text-neutral-900'>{RESISTENCIA}</span>
            <span className='text-xs text-neutral-500'>Disponible actualmente</span>
          </div>
          {status === 'requesting' ? (
            <span className='ml-auto text-xs text-neutral-400'>Buscando...</span>
          ) : (
            <span className='ml-auto text-xs font-semibold text-neutral-900' aria-hidden='true'>
              Usar
            </span>
          )}
        </div>
      </motion.button>

      <div className='rounded-2xl border border-neutral-200 bg-white p-4'>
        <div className='text-sm font-semibold text-neutral-900'>Agregar manualmente otra ciudad</div>
        <div className='mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2'>
          <Search className='h-4 w-4 text-neutral-700' aria-hidden='true' />
          <input
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder='Buscar destino (futuro)'
            className='w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none'
            aria-label='Buscar destino'
          />
        </div>

        <AnimatePresence>
          {invalid ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }}
              className='mt-2 text-xs font-medium text-neutral-500'
            >
              No llegamos ahí por ahora, disculpe las molestias.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

