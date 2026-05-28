import Link from 'next/link'

import { VENDOR_DASHBOARD_PATH } from '@/lib/routes'

export function VendorBreadcrumbs({
  current,
}: {
  current: string
}) {
  return (
    <nav aria-label='Breadcrumb'>
      <ol className='flex items-center gap-2 text-sm text-muted-foreground'>
        <li>
          <Link href={VENDOR_DASHBOARD_PATH} className='hover:text-foreground'>
            Dashboard Vendor
          </Link>
        </li>
        <li aria-hidden='true'>/</li>
        <li className='text-foreground'>{current}</li>
      </ol>
    </nav>
  )
}

