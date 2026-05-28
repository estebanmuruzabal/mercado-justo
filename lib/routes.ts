/**
 * Rutas centralizadas de la app. Importar siempre desde `@/lib/routes`.
 */

// ——— Público ———
export const HOME_PATH = '/' as const

// ——— Auth ———
export const SIGN_IN_PATH = '/signin' as const
export const SIGN_UP_PATH = '/signup' as const

export function signInPathWithCallback(callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl })
  return `${SIGN_IN_PATH}?${params.toString()}`
}

export function signUpPathWithCallback(callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl })
  return `${SIGN_UP_PATH}?${params.toString()}`
}

// ——— Checkout ———
export const CHECKOUT_PATH = '/checkout' as const
export const PURCHASE_SUCCESS_PATH = '/purchase-success' as const
export const PROFILE_PURCHASE_SUCCESS_PATH = '/profile/purchase-success' as const

// ——— Perfil (buyer) ———
export const PROFILE_PATH = '/profile' as const
export const PROFILE_SELLER_PATH = '/profile/seller' as const
export const PROFILE_SALES_PATH = '/profile/sales' as const
export const PROFILE_NOTIFICATIONS_PATH = '/profile/notifications' as const

// ——— Vendor: onboarding ———
export const BECOME_VENDOR_PATH = '/become-vendor' as const

// ——— Vendor: dashboard ———
export const VENDOR_DASHBOARD_PATH = '/dashboard-vendor' as const
export const VENDOR_SELLER_PATH = '/dashboard-vendor/seller' as const
export const VENDOR_LISTINGS_PATH = '/dashboard-vendor/listings' as const
export const VENDOR_SALES_PATH = '/dashboard-vendor/ventas' as const
export const VENDOR_CATEGORIES_PATH = '/dashboard-vendor/categorias' as const
export const VENDOR_NOTIFICATIONS_PATH = '/dashboard-vendor/notifications' as const

/** @deprecated Use VENDOR_SELLER_PATH */
export const VENDOR_SELLER_PROFILE_PATH = VENDOR_SELLER_PATH

// ——— Marketplace / listings ———
export function listingDetailPath(listingType: string, listingId: string) {
  return `/listing/${listingType}/${listingId}` as const
}

export function publicSellerPath(storeId: string) {
  return `/seller/${storeId}` as const
}

// ——— Notificaciones (helpers) ———
export function allNotificationsPath(isSeller: boolean) {
  return isSeller ? VENDOR_NOTIFICATIONS_PATH : PROFILE_NOTIFICATIONS_PATH
}
