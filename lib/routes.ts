/**
 * Rutas centralizadas de la app. Importar siempre desde `@/lib/routes`.
 */

// ——— Público ———
export const HOME_PATH = '/' as const

// ——— Auth ———
export const SIGN_IN_PATH = '/signin' as const
export const SIGN_UP_PATH = '/signup' as const
export const FORGOT_PASSWORD_PATH = '/forgot-password' as const
export const RESET_PASSWORD_PATH = '/reset-password' as const
export const AUTH_CALLBACK_PATH = '/auth/callback' as const

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
/** Overview — landing del panel vendedor */
export const VENDOR_DASHBOARD_PATH = '/dashboard-vendor' as const
export const VENDOR_STORE_CREATED_PARAM = 'storeCreated' as const

export function vendorDashboardPathAfterStoreCreated() {
  const params = new URLSearchParams({ [VENDOR_STORE_CREATED_PARAM]: '1' })
  return `${VENDOR_DASHBOARD_PATH}?${params.toString()}`
}
export const VENDOR_INFORMATION_PATH = '/dashboard-vendor/vendor-information' as const
export const VENDOR_LISTINGS_PATH = '/dashboard-vendor/listings' as const
export const VENDOR_SALES_PATH = '/dashboard-vendor/sales' as const
export const VENDOR_CATEGORIES_PATH = '/dashboard-vendor/categorias' as const
export const VENDOR_NOTIFICATIONS_PATH = '/dashboard-vendor/notifications' as const

/** @deprecated Use VENDOR_INFORMATION_PATH */
export const VENDOR_SELLER_PROFILE_PATH = VENDOR_INFORMATION_PATH

// ——— Super Admin Panel ———
/** Landing del panel de administración global (solo staff). */
export const ADMIN_DASHBOARD_PATH = '/admin' as const
export const ADMIN_VENDORS_PATH = '/admin/vendors' as const
export const ADMIN_LISTINGS_PATH = '/admin/listings' as const
export const ADMIN_ORDERS_PATH = '/admin/orders' as const
export const ADMIN_LOGISTICS_PATH = '/admin/logistics' as const
export const ADMIN_MODERATION_PATH = '/admin/moderation' as const
export const ADMIN_NOTIFICATIONS_PATH = '/admin/notifications' as const
export const ADMIN_ANALYTICS_PATH = '/admin/analytics' as const

// ——— Marketplace / listings ———
export function listingDetailPath(listingType: string, listingId: string) {
  return `/listing/${listingType}/${listingId}` as const
}

/** Public storefront of a vendor, addressed by its unique slug. */
export function publicVendorPath(slug: string) {
  return `/vendor/${slug}` as const
}

/**
 * @deprecated Use {@link publicVendorPath}. Kept for legacy links; the
 * `/seller/[storeId]` route now redirects to the slug-based profile.
 */
export function publicSellerPath(storeId: string) {
  return `/seller/${storeId}` as const
}

// ——— Notificaciones (helpers) ———
export function allNotificationsPath(isSeller: boolean) {
  return isSeller ? VENDOR_NOTIFICATIONS_PATH : PROFILE_NOTIFICATIONS_PATH
}
