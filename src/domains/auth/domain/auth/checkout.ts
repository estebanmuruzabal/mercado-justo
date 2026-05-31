import {
  CHECKOUT_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  signInPathWithCallback,
  signUpPathWithCallback,
} from '@/shared/routing/routes'

export { CHECKOUT_PATH }

export {
  normalizeAuthCallbackUrl,
  normalizeCheckoutCallbackUrl,
  getPostAuthRedirectPath,
} from './callback-url'

import { normalizeCheckoutCallbackUrl } from './callback-url'

export function getCheckoutSignInUrl(callbackUrl: string = CHECKOUT_PATH) {
  return signInPathWithCallback(normalizeCheckoutCallbackUrl(callbackUrl))
}

export function getCheckoutSignUpUrl(callbackUrl: string = CHECKOUT_PATH) {
  return signUpPathWithCallback(normalizeCheckoutCallbackUrl(callbackUrl))
}

export { SIGN_IN_PATH, SIGN_UP_PATH }
