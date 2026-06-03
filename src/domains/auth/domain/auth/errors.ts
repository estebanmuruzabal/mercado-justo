export function mapAuthErrorMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) {
    return 'No se pudo completar la autenticación. Intentá de nuevo.'
  }

  const lower = trimmed.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Ese email ya está registrado. Probá iniciar sesión.'
  }

  if (
    lower.includes('upstream server') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnrefused')
  ) {
    return 'No se pudo conectar con Supabase. Verificá que esté corriendo (`supabase start`).'
  }

  if (lower.includes('password') && lower.includes('least')) {
    return trimmed
  }

  return trimmed
}

export function mapAuthActionFailure(error: unknown): string {
  if (error instanceof Error) {
    return mapAuthErrorMessage(error.message)
  }

  if (typeof error === 'string' && error.trim()) {
    return mapAuthErrorMessage(error)
  }

  return 'No se pudo completar la autenticación. Intentá de nuevo.'
}
