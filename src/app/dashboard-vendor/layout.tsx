import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { VendorSidebar } from '@/domains/vendors/presentation/dashboard/VendorSidebar'
import { VendorClientProviders } from '@/domains/vendors/presentation/dashboard/VendorClientProviders'
import { vendorHasDittoSellerAccess } from '@/domains/dittobots/application/queries/vendor-ditto-bots.queries'
import { createClient } from '@/shared/database/supabase/server'
import { getUserRoleByUserId } from '@/domains/users/application/queries/user.queries'
import { isStaff } from '@/domains/users/domain/roles'
import { ADMIN_DASHBOARD_PATH } from '@/shared/routing/routes'

export default async function DashboardVendorLayout({ children }: { children: ReactNode }) {
  // Platform staff manage the marketplace from the admin panel, never the vendor panel.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const role = await getUserRoleByUserId(user.id)
    if (isStaff(role)) {
      redirect(ADMIN_DASHBOARD_PATH)
    }
  }

  let showDittoBots = false
  if (user) {
    showDittoBots = await vendorHasDittoSellerAccess(user.id)
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        <VendorSidebar showDittoBots={showDittoBots} />
        <div className='flex-1'><VendorClientProviders>{children}</VendorClientProviders></div>
      </div>
    </div>
  )
}
