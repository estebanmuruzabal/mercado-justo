import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { VendorSidebar } from '@/components/vendor-dashboard/VendorSidebar'
import { createClient } from '@/lib/supabase/server'
import { getUserRoleByUserId } from '@/server/queries/user.queries'
import { isStaff } from '@/lib/roles'
import { ADMIN_DASHBOARD_PATH } from '@/lib/routes'

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
