import type { ReactNode } from 'react'

import { requireStaff } from '@/shared/auth/guards/require-staff'
import { permissionsForRole } from '@/shared/auth/permissions'
import { AdminSidebar } from '@/shared/admin-ui/AdminSidebar'
import { AdminMobileNav } from '@/shared/admin-ui/AdminMobileNav'
import { ADMIN_DASHBOARD_PATH } from '@/shared/routing/routes'

const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super Admin',
  'logistics-admin': 'Logística',
  moderator: 'Moderador',
  support: 'Soporte',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await requireStaff(ADMIN_DASHBOARD_PATH)
  const permissions = [...permissionsForRole(role)]

  return (
    <div className='min-h-screen bg-muted/20'>
      <div className='flex'>
        <AdminSidebar permissions={permissions} />

        <div className='flex min-h-screen flex-1 flex-col'>
          <header className='sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6'>
            <div className='flex items-center gap-3'>
              <AdminMobileNav permissions={permissions} />
              <span className='text-sm font-semibold md:hidden'>Admin Panel</span>
            </div>
            <span className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
              {ROLE_LABELS[role] ?? role}
            </span>
          </header>

          <main className='flex-1 px-4 py-6 md:px-6 md:py-8'>{children}</main>
        </div>
      </div>
    </div>
  )
}
