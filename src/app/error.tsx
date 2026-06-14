'use client'

import { useEffect } from 'react'

import { SupabaseUnavailableView } from '@/shared/shell/system/supabase-unavailable'
import { Button } from '@/shared/ui/button'
import { isSupabaseUnavailableError } from '@/shared/database/supabase/connection-error'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  if (isSupabaseUnavailableError(error)) {
    return <SupabaseUnavailableView onRetry={reset} />
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
      <p className="text-muted-foreground text-sm">
        Ocurrió un error inesperado. Podés intentar de nuevo.
      </p>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </main>
  )
}
