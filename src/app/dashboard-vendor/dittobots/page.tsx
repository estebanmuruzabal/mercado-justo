import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  listVendorDittoBotStock,
  listVendorDittoBotUnits,
  requireVendorStore,
  vendorHasDittoSellerAccess,
} from '@/domains/dittobots/application/queries/vendor-ditto-bots.queries'
import {
  VendorDittoBotsHeader,
  VendorDittoBotsPanel,
} from '@/domains/dittobots/presentation/vendor-dittobots-panel'
import { VendorBreadcrumbs } from '@/domains/vendors/presentation/dashboard/VendorBreadcrumbs'
import { createClient } from '@/shared/database/supabase/server'
import { BECOME_VENDOR_PATH, SIGN_IN_PATH, VENDOR_DASHBOARD_PATH } from '@/shared/routing/routes'

export const dynamic = 'force-dynamic'

export default async function VendorDittoBotsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(SIGN_IN_PATH)

  const hasDittoSeller = await vendorHasDittoSellerAccess(user.id)
  if (!hasDittoSeller) {
    redirect(VENDOR_DASHBOARD_PATH)
  }

  const store = await requireVendorStore(user.id)

  if (!store) {
    return (
      <main className='min-h-screen px-6 py-10'>
        <div className='mx-auto max-w-6xl space-y-6'>
          <VendorBreadcrumbs current='Mis DittoBots' />
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold'>Mis DittoBots</h1>
            <p className='text-muted-foreground'>
              Necesitás una tienda activa para ver el stock asignado.
            </p>
          </div>
          <Link href={BECOME_VENDOR_PATH} className='text-sm text-muted-foreground hover:text-foreground'>
            ← Activar modo vendedor
          </Link>
        </div>
      </main>
    )
  }

  const [stock, allUnits] = await Promise.all([
    listVendorDittoBotStock(user.id),
    listVendorDittoBotUnits(user.id),
  ])

  const unitsByProduct = allUnits.reduce<Record<string, typeof allUnits>>((acc, unit) => {
    const key = unit.productId ?? 'unknown'
    acc[key] = acc[key] ?? []
    acc[key].push(unit)
    return acc
  }, {})

  return (
    <main className='min-h-screen px-6 py-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <VendorBreadcrumbs current='Mis DittoBots' />
        <VendorDittoBotsHeader storeName={store.name} />
        <VendorDittoBotsPanel stock={stock} unitsByProduct={unitsByProduct} />
      </div>
    </main>
  )
}
