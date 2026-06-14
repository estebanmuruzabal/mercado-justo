import {
  listDittoBotInventoryAdmin,
  listDittoBotProductsForAdmin,
} from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import { DittoBotInventoryPanel } from '@/shared/admin-ui/dittobots/DittoBotInventoryPanel'

export const dynamic = 'force-dynamic'

export default async function AdminDittoBotInventoryPage() {
  const [units, products] = await Promise.all([
    listDittoBotInventoryAdmin(),
    listDittoBotProductsForAdmin(),
  ])

  return (
    <DittoBotInventoryPanel
      initialUnits={units}
      products={products}
    />
  )
}
