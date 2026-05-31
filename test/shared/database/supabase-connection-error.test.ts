import { describe, expect, it } from 'vitest'

import {
  SupabaseUnavailableError,
  isSupabaseUnavailableError,
  throwOnSupabaseError,
} from '@/shared/database/supabase/connection-error'

describe('isSupabaseUnavailableError', () => {
  it('detects SupabaseUnavailableError instances', () => {
    expect(isSupabaseUnavailableError(new SupabaseUnavailableError())).toBe(true)
  })

  it('detects ECONNREFUSED in serialized Supabase errors', () => {
    const error = new Error(
      JSON.stringify({
        message: 'TypeError: fetch failed',
        details:
          'TypeError: fetch failed\n\nCaused by: Error: connect ECONNREFUSED 127.0.0.1:54321',
      }),
    )

    expect(isSupabaseUnavailableError(error)).toBe(true)
  })

  it('detects fetch failed against local Supabase port', () => {
    expect(
      isSupabaseUnavailableError(new Error('fetch failed connecting to http://127.0.0.1:54321')),
    ).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isSupabaseUnavailableError(new Error('permission denied for table listing'))).toBe(false)
  })
})

describe('throwOnSupabaseError', () => {
  it('wraps connection failures with SupabaseUnavailableError', () => {
    const raw = new Error(
      JSON.stringify({
        message: 'TypeError: fetch failed',
        details: 'Error: connect ECONNREFUSED 127.0.0.1:54321',
      }),
    )

    expect(() => throwOnSupabaseError(raw)).toThrow(SupabaseUnavailableError)
  })

  it('rethrows non-connection errors unchanged', () => {
    const raw = new Error('RLS violation')

    expect(() => throwOnSupabaseError(raw)).toThrow(raw)
  })
})
