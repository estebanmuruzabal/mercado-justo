import type { ReactNode } from 'react'

import { requireSuperAdmin } from '@/shared/auth/guards/require-staff'
import { DittoBotAdminTabs } from '@/shared/admin-ui/dittobots/DittoBotAdminTabs'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default async function AdminDittoBotsLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <PageHeader
        title='DittoBots'
        description='Catálogo oficial, inventario físico y asignación regional.'
      />
      <DittoBotAdminTabs />
      {children}
    </div>
  )
}
