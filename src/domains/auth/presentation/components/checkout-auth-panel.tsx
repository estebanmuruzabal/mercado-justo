'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { CHECKOUT_PATH } from '@/domains/auth/domain/auth/checkout'
import { SignInForm } from './sign-in-form'
import { SignUpForm } from './sign-up-form'

export type CheckoutAuthView = 'prompt' | 'signup' | 'signin'

export function CheckoutAuthPanel({
  view,
  onViewChange,
  onAuthenticated,
}: {
  view: CheckoutAuthView
  onViewChange: (view: CheckoutAuthView) => void
  onAuthenticated?: () => void
}) {
  if (view === 'signup') {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={() => onViewChange('prompt')}
          className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' aria-hidden='true' />
          Volver
        </button>
        <SignUpForm
          callbackUrl={CHECKOUT_PATH}
          redirectFallback={CHECKOUT_PATH}
          compact
          onSuccess={onAuthenticated}
        />
        <p className='text-center text-sm text-muted-foreground'>
          ¿Ya tenés cuenta?{' '}
          <button
            type='button'
            className='font-medium text-primary hover:underline'
            onClick={() => onViewChange('signin')}
          >
            Iniciá sesión
          </button>
        </p>
      </div>
    )
  }

  if (view === 'signin') {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={() => onViewChange('prompt')}
          className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' aria-hidden='true' />
          Volver
        </button>
        <SignInForm
          callbackUrl={CHECKOUT_PATH}
          redirectFallback={CHECKOUT_PATH}
          compact
          onSuccess={onAuthenticated}
        />
        <p className='text-center text-sm text-muted-foreground'>
          ¿Primera vez acá?{' '}
          <button
            type='button'
            className='font-medium text-primary hover:underline'
            onClick={() => onViewChange('signup')}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap'>
      <Button type='button' className='w-full sm:flex-1' onClick={() => onViewChange('signup')}>
        Crear cuenta
      </Button>
      <Button type='button' variant='outline' className='w-full sm:flex-1' onClick={() => onViewChange('signin')}>
        Iniciar sesión
      </Button>
    </div>
  )
}
