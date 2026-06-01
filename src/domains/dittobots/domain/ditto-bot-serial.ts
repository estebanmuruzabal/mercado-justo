const DEFAULT_PREFIX = 'DTB-'
const SERIAL_PAD = 6

export type GenerateSerialsInput = {
  prefix?: string
  start: number
  quantity: number
}

export function formatDittoBotSerial(prefix: string, sequence: number): string {
  const normalizedPrefix = prefix.trim().toUpperCase() || DEFAULT_PREFIX
  const padded = String(sequence).padStart(SERIAL_PAD, '0')
  return `${normalizedPrefix}${padded}`
}

export function generateDittoBotSerials(input: GenerateSerialsInput): string[] {
  const { quantity, start } = input
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a cero.')
  }
  if (start < 0) {
    throw new Error('El inicio de serie no puede ser negativo.')
  }

  const prefix = input.prefix?.trim() || DEFAULT_PREFIX
  return Array.from({ length: quantity }, (_, i) => formatDittoBotSerial(prefix, start + i))
}

export function generateActivationCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}
