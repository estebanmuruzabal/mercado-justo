export { CHECKOUT_PATH } from './checkout-constants'

export {
  normalizeAuthCallbackUrl,
  normalizeCheckoutCallbackUrl,
  getPostAuthRedirectPath,
} from './callback-url'

import { normalizeCheckoutCallbackUrl } from './callback-url'
import { CHECKOUT_PATH } from './checkout-constants'

function buildAuthUrl(pathname: string, callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl })
  return `${pathname}?${params.toString()}`
}

export function getCheckoutSignInUrl(callbackUrl = CHECKOUT_PATH) {
  return buildAuthUrl('/signin', normalizeCheckoutCallbackUrl(callbackUrl))
}

export function getCheckoutSignUpUrl(callbackUrl = CHECKOUT_PATH) {
  return buildAuthUrl('/signup', normalizeCheckoutCallbackUrl(callbackUrl))
}
