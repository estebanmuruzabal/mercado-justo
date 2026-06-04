import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', 'debug')
    vi.stubEnv('NEXT_PUBLIC_LOG_LEVEL', 'debug')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('formats debug lines with timestamp, level, scope, message and meta', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const { logger } = await import('@/shared/lib/logger/logger')

    logger.debug('checkout.createOrder', 'items received', { count: 3 })

    expect(debugSpy).toHaveBeenCalledOnce()
    const line = String(debugSpy.mock.calls[0]?.[0])
    expect(line).toMatch(/^\[\d{4}-\d{2}-\d{2}T/)
    expect(line).toContain('[debug]')
    expect(line).toContain('[checkout.createOrder]')
    expect(line).toContain('items received')
    expect(line).toContain('{"count":3}')
  })

  it('createLogger binds scope for subsequent calls', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { createLogger, LogScopes } = await import('@/shared/lib/logger/logger')
    const log = createLogger(LogScopes.cart.addItem)

    log.info('item added', { variantId: 'v-1' })

    expect(infoSpy).toHaveBeenCalledOnce()
    expect(String(infoSpy.mock.calls[0]?.[0])).toContain('[cart.addItem]')
  })

  it('respects LOG_LEVEL and skips lower-priority messages', async () => {
    vi.stubEnv('LOG_LEVEL', 'warn')
    vi.stubEnv('NEXT_PUBLIC_LOG_LEVEL', 'warn')
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const { logger } = await import('@/shared/lib/logger/logger')

    logger.debug('checkout.stock', 'should not print')

    expect(debugSpy).not.toHaveBeenCalled()
  })

  it('routes error and warn to console.error and console.warn', async () => {
    vi.stubEnv('LOG_LEVEL', 'error')
    vi.stubEnv('NEXT_PUBLIC_LOG_LEVEL', 'error')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { logger } = await import('@/shared/lib/logger/logger')

    logger.error('checkout.orders', 'failed', { reason: 'stock' })
    logger.warn('checkout.orders', 'retrying')

    expect(errorSpy).toHaveBeenCalledOnce()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
