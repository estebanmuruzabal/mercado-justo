export const LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug', 'trace'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

/** Canonical scopes for checkout and cart flows. */
export const LogScopes = {
  checkout: {
    createOrder: 'checkout.createOrder',
    resolveVariants: 'checkout.resolveVariants',
    stock: 'checkout.stock',
    orders: 'checkout.orders',
  },
  cart: {
    addItem: 'cart.addItem',
    removeItem: 'cart.removeItem',
    updateQuantity: 'cart.updateQuantity',
  },
} as const

const LEVEL_RANK: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
}

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value)
}

function isBrowserRuntime(): boolean {
  // Vitest/jsdom defines window; server-side tests must still honor LOG_LEVEL.
  if (process.env.VITEST) return false
  return typeof window !== 'undefined'
}

function resolveConfiguredLevel(): LogLevel {
  const raw = isBrowserRuntime()
    ? process.env.NEXT_PUBLIC_LOG_LEVEL
    : process.env.LOG_LEVEL

  if (raw && isLogLevel(raw)) return raw

  return process.env.NODE_ENV === 'production' ? 'warn' : 'info'
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = resolveConfiguredLevel()
  if (configuredLevel === 'silent') return false
  return LEVEL_RANK[level] <= LEVEL_RANK[configuredLevel]
}

function formatMeta(meta: unknown): string {
  if (meta === undefined) return ''
  if (typeof meta === 'string') return meta
  try {
    return JSON.stringify(meta)
  } catch {
    return String(meta)
  }
}

function formatLine(level: LogLevel, scope: string, message: string, meta?: unknown): string {
  const parts = [`[${new Date().toISOString()}]`, `[${level}]`, `[${scope}]`, message]
  if (meta !== undefined) {
    parts.push(formatMeta(meta))
  }
  return parts.join(' ')
}

function write(level: LogLevel, scope: string, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return

  const line = formatLine(level, scope, message, meta)

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'info':
      console.info(line)
      break
    case 'debug':
      console.debug(line)
      break
    case 'trace':
      console.log(line)
      break
    default:
      break
  }
}

export type ScopedLogger = {
  error: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  info: (message: string, meta?: unknown) => void
  debug: (message: string, meta?: unknown) => void
  trace: (message: string, meta?: unknown) => void
}

export function createLogger(scope: string): ScopedLogger {
  return {
    error: (message, meta) => write('error', scope, message, meta),
    warn: (message, meta) => write('warn', scope, message, meta),
    info: (message, meta) => write('info', scope, message, meta),
    debug: (message, meta) => write('debug', scope, message, meta),
    trace: (message, meta) => write('trace', scope, message, meta),
  }
}

export const logger = {
  error: (scope: string, message: string, meta?: unknown) => write('error', scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) => write('warn', scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) => write('info', scope, message, meta),
  debug: (scope: string, message: string, meta?: unknown) => write('debug', scope, message, meta),
  trace: (scope: string, message: string, meta?: unknown) => write('trace', scope, message, meta),
}
