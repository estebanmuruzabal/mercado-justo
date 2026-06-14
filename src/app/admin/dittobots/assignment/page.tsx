import {
  listAvailableUnitsForAssignment,
  listDittoBotProductsForAdmin,
  listRegionalVendorsForAssignment,
  listRegionalVendorsForDittoSellerAdmin,
} from '@/domains/dittobots/application/queries/admin-ditto-bot-products.queries'
import { DittoBotAssignmentPanel } from '@/shared/admin-ui/dittobots/DittoBotAssignmentPanel'

export const dynamic = 'force-dynamic'

export default async function AdminDittoBotAssignmentPage() {
  const [availableUnits, vendors, allVendors, products] = await Promise.all([
    listAvailableUnitsForAssignment(),
    listRegionalVendorsForAssignment(),
    listRegionalVendorsForDittoSellerAdmin(),
    listDittoBotProductsForAdmin(),
  ])

  return (
    <DittoBotAssignmentPanel
      availableUnits={availableUnits}
      vendors={vendors}
      allVendors={allVendors}
      products={products}
    />
  )
}
