import { APP_ENV } from '@/shared/env-config/environment'

export const SUPABASE_UNAVAILABLE_CODE = 'SUPABASE_UNAVAILABLE' as const

export class SupabaseUnavailableError extends Error {
  readonly code = SUPABASE_UNAVAILABLE_CODE

  constructor(cause?: unknown) {
    super(getSupabaseUnavailableMessage())
    this.name = 'SupabaseUnavailableError'
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export function isLocalSupabaseHost(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  return /127\.0\.0\.1|localhost/.test(url)
}

export function getSupabaseUnavailableMessage(): string {
  if (APP_ENV === 'development' || isLocalSupabaseHost()) {
    return 'La base de datos local no está disponible. Ejecutá `npm run db:start` en la terminal del proyecto para levantar Supabase.'
  }

  return 'No pudimos conectar con la base de datos. Intentá de nuevo en unos minutos.'
}

function collectErrorText(error: unknown): string {
  const parts: string[] = []

  const visit = (value: unknown, depth = 0): void => {
    if (value == null || depth > 4) return

    if (value instanceof SupabaseUnavailableError) {
      parts.push(value.message, value.code)
      visit(value.cause, depth + 1)
      return
    }

    if (value instanceof Error) {
      parts.push(value.message, value.name, value.stack ?? '')
      visit(value.cause, depth + 1)
      return
    }

    if (typeof value === 'string') {
      parts.push(value)
      return
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      for (const key of ['message', 'details', 'hint', 'code', 'name']) {
        if (typeof record[key] === 'string') {
          parts.push(record[key] as string)
        }
      }

      visit(record.cause, depth + 1)
      visit(record.error, depth + 1)

      try {
        parts.push(JSON.stringify(value))
      } catch {
        parts.push(String(value))
      }
    }
  }

  visit(error)
  return parts.join('\n').toLowerCase()
}

export function isSupabaseUnavailableError(error: unknown): boolean {
  if (error instanceof SupabaseUnavailableError) return true

  const text = collectErrorText(error)

  if (text.includes('econnrefused')) return true
  if (text.includes('enotfound') && text.includes('supabase')) return true
  if (text.includes('fetch failed') && (text.includes('54321') || text.includes('supabase'))) {
    return true
  }
  if (text.includes('networkerror') && text.includes('fetch')) return true

  return false
}

/** Re-throw Supabase connection failures with a friendly, actionable message. */
export function throwOnSupabaseError(error: unknown): void {
  if (!error) return

  if (isSupabaseUnavailableError(error)) {
    throw new SupabaseUnavailableError(error)
  }

  throw error
}
