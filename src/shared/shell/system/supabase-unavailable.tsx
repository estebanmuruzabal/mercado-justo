'use client'

import { DatabaseZap } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import {
  getSupabaseUnavailableMessage,
  isLocalSupabaseHost,
} from '@/shared/database/supabase/connection-error'

type SupabaseUnavailableViewProps = {
  onRetry?: () => void
}

export function SupabaseUnavailableView({ onRetry }: SupabaseUnavailableViewProps) {
  const isLocal = isLocalSupabaseHost()

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <DatabaseZap className="size-7" aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Base de datos no disponible</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {getSupabaseUnavailableMessage()}
        </p>
      </div>

      {isLocal ? (
        <div className="bg-muted/60 w-full rounded-lg border px-4 py-3 text-left font-mono text-xs leading-relaxed">
          <p className="text-muted-foreground mb-2 font-sans text-sm">En la terminal del proyecto:</p>
          <code>npm run db:start</code>
        </div>
      ) : null}

      {onRetry ? (
        <Button type="button" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </main>
  )
}
