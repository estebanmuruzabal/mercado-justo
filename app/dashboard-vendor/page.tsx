import { redirect } from 'next/navigation'

import { VENDOR_LISTINGS_PATH } from '@/lib/routes'

export default function DashboardVendorIndexPage() {
  redirect(VENDOR_LISTINGS_PATH)
}

