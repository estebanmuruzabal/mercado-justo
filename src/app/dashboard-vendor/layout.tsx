import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { VendorSidebar } from '@/domains/vendors/presentation/dashboard/VendorSidebar'
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

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        <VendorSidebar />
        <div className='flex-1'>{children}</div>
      </div>
    </div>
  )
}
