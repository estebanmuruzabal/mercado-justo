import type { ReactNode } from 'react'

import { VendorSidebar } from '@/components/vendor-dashboard/VendorSidebar'

export default function DashboardVendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        <VendorSidebar />
        <div className='flex-1'>{children}</div>
      </div>
    </div>
  )
}

