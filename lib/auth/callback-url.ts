import { CHECKOUT_PATH } from './checkout-constants'

export { CHECKOUT_PATH } from './checkout-constants'

export function normalizeAuthCallbackUrl(
  callbackUrl?: string | null,
  fallback: string = '/',
): string {
  if (!callbackUrl) return fallback
  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return fallback
  }
  return callbackUrl
}

export function normalizeCheckoutCallbackUrl(callbackUrl?: string | null): string {
  return normalizeAuthCallbackUrl(callbackUrl, CHECKOUT_PATH)
}

export function getPostAuthRedirectPath(callbackUrl?: string | null, fallback: string = '/'): string {
  return normalizeAuthCallbackUrl(callbackUrl, fallback)
}
