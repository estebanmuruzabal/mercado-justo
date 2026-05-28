export function mapAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Tenés que confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.'
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Ese email ya está registrado. Probá iniciar sesión.'
  }

  if (lower.includes('password') && lower.includes('least')) {
    return message
  }

  return message
}
