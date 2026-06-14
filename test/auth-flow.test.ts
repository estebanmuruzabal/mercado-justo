import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerUser, signIn, signOut } from '@/domains/auth/application/actions/auth'
import { createClient } from '@/shared/database/supabase/server'

vi.mock('@/shared/database/supabase/server')
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    delete: vi.fn(),
  })),
}))

describe('Authentication Flow', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  })

  describe('registerUser', () => {
    it('returns ok when signup returns a session', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: '123' },
          session: { access_token: 'token' },
        },
        error: null,
      })

      const result = await registerUser({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        callbackUrl: '/checkout',
      })

      expect(result).toEqual({ ok: true, redirectTo: '/checkout' })
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('signs in silently when signup has no session', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: '123' },
          session: null,
        },
        error: null,
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      })

      const result = await registerUser({
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: '/',
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ ok: true, redirectTo: '/' })
    })

    it('returns error on signup failure', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      const result = await registerUser({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual({ error: 'Ese email ya está registrado. Probá iniciar sesión.' })
    })
  })

  describe('signIn', () => {
    it('returns ok with redirect path', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: '/checkout',
      })

      expect(result).toEqual({ ok: true, redirectTo: '/checkout' })
    })

    it('returns error on invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result).toEqual({ error: 'Email o contraseña incorrectos.' })
    })
  })

  describe('signOut', () => {
    it('should sign out and redirect home', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await expect(signOut()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })
})
