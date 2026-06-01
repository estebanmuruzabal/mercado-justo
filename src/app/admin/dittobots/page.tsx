import { requireSuperAdmin } from '@/shared/auth/guards/require-staff'
import { listDittoBotInventoryForAdmin } from '@/domains/dittobots/application/queries/admin-ditto-bot-inventory.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { DittoBotInventoryPanel } from '@/shared/admin-ui/dittobots/DittoBotInventoryPanel'

export const dynamic = 'force-dynamic'

export default async function AdminDittoBotsPage() {
  await requireSuperAdmin()
  const units = await listDittoBotInventoryForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='DittoBot Inventory'
        description={`${units.length} unidad${units.length === 1 ? '' : 'es'} registrada${units.length === 1 ? '' : 's'}.`}
      />
      <DittoBotInventoryPanel initialUnits={units} />
    </div>
  )
}
