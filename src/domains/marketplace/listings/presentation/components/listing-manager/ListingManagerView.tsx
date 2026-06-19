'use client'

import { ListingManagerDashboard } from './ListingManagerDashboard'
import { ListingManagerModal } from './ListingManagerModal'
import { useListingManager } from './hooks/use-listing-manager'
import { listingTypeLabel } from './utils/category.utils'

export function ListingManagerView() {
  const manager = useListingManager()

  return (
    <>
      <ListingManagerDashboard
        categoriesLoading={manager.categoriesLoading}
        categoriesError={manager.categoriesError}
        managerLoading={manager.managerLoading}
        managerError={manager.managerError}
        drafts={manager.drafts}
        published={manager.published}
        byId={manager.byId}
        onCreateListing={manager.openCreateModalForListingType}
        onEdit={manager.openEditModal}
        onDelete={manager.setDeleteCandidate}
      />

      <ListingManagerModal
        modalOpen={manager.modalOpen}
        setModalOpen={manager.handleModalOpenChange}
        step={manager.step}
        setStep={manager.setStep}
        form={manager.form}
        template={manager.template}
        byId={manager.byId}
        listingTypeLabel={(lt) => (lt ? listingTypeLabel(lt) : '')}
        onProductBaseSelect={manager.handleProductBaseSelect}
        onIdentificationImageCaptured={manager.handleIdentificationImageCaptured}
        onPendingImagesChange={manager.handlePendingImagesChange}
        formBusy={manager.formBusy}
        formError={manager.formError}
        handleStep1Next={manager.handleStep1Next}
        handleStep2Next={manager.handleStep2Next}
        handleSaveDraft={manager.handleSaveDraft}
        handlePublish={manager.handlePublish}
        sellerLocation={manager.sellerLocation}
        variants={manager.variants}
        variantsLoading={manager.variantsLoading}
        setVariants={manager.setVariants}
        setForm={manager.setForm}
        deleteCandidate={manager.deleteCandidate}
        setDeleteCandidate={manager.setDeleteCandidate}
        deleteBusy={manager.deleteBusy}
        handleDeleteConfirmed={manager.handleDeleteConfirmed}
      />
    </>
  )
}
