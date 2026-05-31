#!/usr/bin/env node
/**
 * One-shot import path migration: legacy @/components, @/lib, @/server, @/hooks, @/stores → @/domains, @/shared
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const REPLACEMENTS = [
  // @/src/shared → @/shared
  ["@/src/shared/", '@/shared/'],

  // Server queries (most specific first)
  ['@/server/queries/admin/categories.queries', '@/domains/marketplace/categories/application/queries/admin-categories.queries'],
  ['@/server/queries/admin/listings.queries', '@/domains/marketplace/listings/application/queries/admin-listings.queries'],
  ['@/server/queries/admin/orders.queries', '@/domains/marketplace/orders/application/queries/admin-orders.queries'],
  ['@/server/queries/admin/users.queries', '@/domains/users/application/queries/admin-users.queries'],
  ['@/server/queries/admin/vendors.queries', '@/domains/vendors/application/queries/admin-vendors.queries'],
  ['@/server/queries/admin/moderation.queries', '@/domains/moderation/application/queries/moderation.queries'],
  ['@/server/queries/admin/logistics.queries', '@/domains/logistics/application/queries/logistics.queries'],
  ['@/server/queries/admin/dashboard.queries', '@/domains/logistics/application/queries/dashboard.queries'],
  ['@/server/queries/admin/analytics.queries', '@/domains/logistics/application/queries/analytics.queries'],
  ['@/server/queries/admin/notifications.queries', '@/domains/community/notifications/application/queries/admin-notifications.queries'],
  ['@/server/queries/marketplace.queries', '@/domains/marketplace/listings/application/queries/marketplace.queries'],
  ['@/server/queries/listing.queries', '@/domains/marketplace/listings/application/queries/listing.queries'],
  ['@/server/queries/vendor.queries', '@/domains/vendors/application/queries/vendor.queries'],
  ['@/server/queries/store.queries', '@/domains/vendors/application/queries/store.queries'],
  ['@/server/queries/user.queries', '@/domains/users/application/queries/user.queries'],
  ['@/server/queries/telegram.queries', '@/domains/dittobots/application/queries/telegram.queries'],

  // Server actions
  ['@/server/actions/admin/listing-moderation.actions', '@/domains/moderation/application/actions/listing-moderation.actions'],
  ['@/server/actions/admin/shipment.actions', '@/domains/logistics/application/actions/shipment.actions'],
  ['@/server/actions/admin/user.actions', '@/domains/users/application/actions/admin-user.actions'],
  ['@/server/actions/admin/vendor.actions', '@/domains/vendors/application/actions/admin-vendor.actions'],
  ['@/server/actions/auth-recovery', '@/domains/auth/application/actions/auth-recovery'],
  ['@/server/actions/auth', '@/domains/auth/application/actions/auth'],
  ['@/server/actions/category.actions', '@/domains/marketplace/categories/application/actions/category.actions'],
  ['@/server/actions/checkout.actions', '@/domains/marketplace/orders/application/actions/checkout.actions'],
  ['@/server/actions/listing-catalog.actions', '@/domains/marketplace/listings/application/actions/listing-catalog.actions'],
  ['@/server/actions/listing-manager.actions', '@/domains/marketplace/listings/application/actions/listing-manager.actions'],
  ['@/server/actions/listing.actions', '@/domains/marketplace/listings/application/actions/listing.actions'],
  ['@/server/actions/notifications.actions', '@/domains/community/notifications/application/actions/notifications.actions'],
  ['@/server/actions/store.actions', '@/domains/vendors/application/actions/store.actions'],
  ['@/server/actions/telegram.actions', '@/domains/dittobots/application/actions/telegram.actions'],
  ['@/server/actions/vendor-follow.actions', '@/domains/vendors/application/actions/vendor-follow.actions'],
  ['@/server/actions/vendor-public.actions', '@/domains/vendors/application/actions/vendor-public.actions'],
  ['@/server/actions/vendor-review.actions', '@/domains/marketplace/reviews/application/actions/vendor-review.actions'],
  ['@/server/actions/vendor-seller-profile.actions', '@/domains/vendors/application/actions/vendor-seller-profile.actions'],
  ['@/server/actions/geocode-address.actions', '@/shared/maps/geocoding/geocode-address.actions'],
  ['@/server/actions/reverse-geocode.actions', '@/shared/maps/geocoding/reverse-geocode.actions'],

  // Server services & admin
  ['@/server/services/store.service', '@/domains/vendors/infrastructure/store.service'],
  ['@/server/services/listing.service', '@/domains/marketplace/listings/infrastructure/listing.service'],
  ['@/server/services/telegram-webhook.service', '@/domains/dittobots/infrastructure/telegram-webhook.service'],
  ['@/server/services/telegram.service', '@/domains/dittobots/infrastructure/telegram.service'],
  ['@/server/services/telegram-notifications.service', '@/domains/dittobots/infrastructure/telegram-notifications.service'],
  ['@/server/services/email/', '@/shared/email/services/'],
  ['@/server/auth/require-staff', '@/shared/auth/guards/require-staff'],
  ['@/server/admin/audit', '@/shared/database/admin-audit'],
  ['@/server/admin/client', '@/shared/database/admin-client'],

  // Components → domains / shared
  ['@/components/vendor-dashboard/vendor-seller/', '@/domains/vendors/presentation/dashboard/vendor-seller/'],
  ['@/components/vendor-dashboard/telegram/', '@/domains/vendors/presentation/dashboard/telegram/'],
  ['@/components/vendor-dashboard/', '@/domains/vendors/presentation/dashboard/'],
  ['@/components/vendor-public/', '@/domains/vendors/presentation/storefront/'],
  ['@/components/vendor/location/', '@/domains/vendors/presentation/shared/location/'],
  ['@/components/become-vendor/become-vendor-form', '@/domains/vendors/presentation/onboarding/become-vendor-form'],
  ['@/components/features/auth/', '@/domains/auth/presentation/components/'],
  ['@/components/checkout/', '@/domains/marketplace/checkout/presentation/components/'],
  ['@/components/listings/detail/', '@/domains/marketplace/listings/presentation/components/detail/'],
  ['@/components/listings/listing-manager/', '@/domains/marketplace/listings/presentation/components/listing-manager/'],
  ['@/components/listings/variants/', '@/domains/marketplace/listings/presentation/components/variants/'],
  ['@/components/listings/ListingManager', '@/domains/marketplace/listings/presentation/components/ListingManager'],
  ['@/components/listings/listing-create-form', '@/domains/marketplace/listings/presentation/components/listing-create-form'],
  ['@/components/marketplace/', '@/domains/marketplace/listings/presentation/marketplace/'],
  ['@/components/notifications/', '@/domains/community/notifications/presentation/components/notifications/'],
  ['@/components/features/cart-drawer/cart-drawer', '@/domains/marketplace/checkout/presentation/cart-drawer/cart-drawer'],
  ['@/components/features/homepage/', '@/domains/marketplace/listings/presentation/home/homepage/'],
  ['@/components/admin/', '@/shared/admin-ui/'],
  ['@/components/layout/', '@/shared/shell/layout/'],
  ['@/components/features/navbar/', '@/shared/shell/navbar/'],
  ['@/components/profile/', '@/domains/users/presentation/profile/'],
  ['@/components/location/', '@/shared/maps/location/presentation/'],
  ['@/components/auth/auth-session-provider', '@/domains/auth/presentation/providers/auth-session-provider'],
  ['@/components/system/supabase-unavailable', '@/shared/shell/system/supabase-unavailable'],
  ['@/components/ui/', '@/shared/ui/'],

  // Hooks
  ['@/hooks/auth/use-auth-navigation', '@/domains/auth/presentation/hooks/use-auth-navigation'],
  ['@/hooks/auth/use-checkout-guard', '@/domains/auth/presentation/hooks/use-checkout-guard'],
  ['@/hooks/auth/use-header-session', '@/domains/auth/presentation/hooks/use-header-session'],
  ['@/hooks/checkout/use-checkout-flow', '@/domains/marketplace/checkout/presentation/hooks/use-checkout-flow'],
  ['@/hooks/checkout/use-checkout-fulfillment', '@/domains/marketplace/checkout/presentation/hooks/use-checkout-fulfillment'],
  ['@/hooks/checkout/use-checkout-seller', '@/domains/marketplace/checkout/presentation/hooks/use-checkout-seller'],
  ['@/hooks/notifications/use-notifications-realtime', '@/domains/community/notifications/presentation/hooks/notifications/use-notifications-realtime'],
  ['@/hooks/notifications/use-unread-notifications', '@/domains/community/notifications/presentation/hooks/notifications/use-unread-notifications'],
  ['@/hooks/location/', '@/shared/maps/location/presentation/hooks/'],
  ['@/hooks/use-user-location', '@/shared/maps/location/presentation/hooks/use-user-location'],
  ['@/hooks/use-marketplace-listings', '@/domains/marketplace/listings/presentation/hooks/use-marketplace-listings'],

  // Stores
  ['@/stores/cart-store/', '@/domains/marketplace/checkout/presentation/stores/cart-store/'],
  ['@/stores/checkout.store', '@/domains/marketplace/checkout/presentation/stores/checkout.store'],
  ['@/stores/notifications.store', '@/domains/community/notifications/presentation/stores/notifications.store'],
  ['@/stores/location.store', '@/shared/maps/location/presentation/stores/location.store'],
  ['@/stores/useUserLocationStore', '@/shared/maps/location/presentation/stores/useUserLocationStore'],
  ['@/stores/useMarketplaceViewStore', '@/domains/marketplace/listings/presentation/stores/useMarketplaceViewStore'],
  ['@/stores/useMarketplaceFiltersStore', '@/domains/marketplace/listings/presentation/stores/useMarketplaceFiltersStore'],
  ['@/stores/useMarketplaceCategoriesStore', '@/domains/marketplace/listings/presentation/stores/useMarketplaceCategoriesStore'],

  // Types
  ['@/types/supabase', '@/shared/types/supabase'],
  ['@/types/roles', '@/domains/users/domain/roles'],
  ['@/types/listing', '@/domains/marketplace/listings/domain/listing-model'],
  ['@/types/marketplace', '@/domains/marketplace/listings/domain/marketplace'],
  ['@/types/vendor', '@/domains/vendors/domain/vendor'],
  ['@/types/store', '@/domains/vendors/domain/store'],
  ['@/types/telegram', '@/shared/telegram/telegram/types'],

  // Lib
  ['@/lib/supabase/', '@/shared/database/supabase/'],
  ['@/lib/routes', '@/shared/routing/routes'],
  ['@/lib/env', '@/shared/config/env'],
  ['@/lib/config/environment', '@/shared/config/environment'],
  ['@/lib/utils', '@/shared/utils/utils'],
  ['@/lib/build-info.generated', '@/shared/utils/build-info.generated'],
  ['@/lib/build-info', '@/shared/utils/build-info'],
  ['@/lib/auth/permissions', '@/shared/auth/permissions'],
  ['@/lib/auth/checkout-constants', '@/domains/auth/domain/auth/checkout-constants'],
  ['@/lib/auth/checkout', '@/domains/auth/domain/auth/checkout'],
  ['@/lib/auth/callback-url', '@/domains/auth/domain/auth/callback-url'],
  ['@/lib/auth/sign-out-client', '@/domains/auth/domain/auth/sign-out-client'],
  ['@/lib/auth/errors', '@/domains/auth/domain/auth/errors'],
  ['@/lib/auth/session-sync', '@/domains/auth/domain/auth/session-sync'],
  ['@/lib/admin/format', '@/shared/utils/admin-format'],
  ['@/lib/admin/status-presentation', '@/shared/utils/admin-status-presentation'],
  ['@/lib/admin/types', '@/domains/logistics/domain/types'],
  ['@/lib/admin/engines/notification-engine', '@/domains/community/notifications/domain/notification-engine'],
  ['@/lib/admin/engines/moderation-engine', '@/domains/moderation/domain/engines/moderation-engine'],
  ['@/lib/admin/engines/logistics-engine', '@/domains/logistics/domain/engines/logistics-engine'],
  ['@/lib/admin/engines/fulfillment-engine', '@/domains/logistics/domain/engines/fulfillment-engine'],
  ['@/lib/admin/engines/sustainability-engine', '@/domains/logistics/domain/engines/sustainability-engine'],
  ['@/lib/telegram/', '@/shared/telegram/telegram/'],
  ['@/lib/notifications/', '@/shared/events/legacy-notifications/'],
  ['@/lib/location/', '@/shared/maps/location/'],
  ['@/lib/motion/', '@/shared/motion/'],
  ['@/lib/listing-image', '@/domains/marketplace/listings/domain/listing-image'],
  ['@/lib/listing', '@/domains/marketplace/listings/domain/listing'],
  ['@/lib/product', '@/domains/marketplace/listings/domain/product'],
  ['@/lib/vendor/', '@/domains/vendors/domain/'],
  ['@/lib/checkout/', '@/domains/marketplace/checkout/domain/checkout/'],
  ['@/lib/roles', '@/domains/users/domain/roles'],

  // services/cart-store
  ['@/services/cart-store/', '@/domains/marketplace/checkout/presentation/stores/cart-store/'],
]

const SKIP_DIRS = new Set(['node_modules', '.next', '.git'])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|mts|cts)$/.test(entry.name)) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(ROOT)) {
  // Skip legacy dirs we will delete (still migrate them first for safety - actually skip after delete)
  const rel = path.relative(ROOT, file)
  if (rel.startsWith('scripts/migrate-imports')) continue

  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    changed++
  }
}

console.log(`Updated ${changed} files`)
