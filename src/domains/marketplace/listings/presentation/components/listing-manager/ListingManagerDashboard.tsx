'use client'

import { PencilLine, Plus, Trash2 } from 'lucide-react'

import type { ListingManagerRow } from '@/domains/marketplace/listings/application/actions/listing-manager.actions'
import type { ListingType } from '@/domains/marketplace/listings/domain/listing'
import { Button } from '@/shared/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/utils/utils'
import { LISTING_MODERATION_PRESENTATION } from '@/src/shared/utils/admin-status-presentation'

import type { CategoryRow } from './types'

type ListingManagerDashboardProps = {
  categoriesLoading: boolean
  categoriesError: string | null
  managerLoading: boolean
  managerError: string | null
  drafts: ListingManagerRow[]
  published: ListingManagerRow[]
  byId: Map<string, CategoryRow>
  onCreateListing: (listingType: ListingType) => void
  onEdit: (row: ListingManagerRow) => void
  onDelete: (row: ListingManagerRow) => void
}

export function ListingManagerDashboard({
  categoriesLoading,
  categoriesError,
  managerLoading,
  managerError,
  drafts,
  published,
  byId,
  onCreateListing,
  onEdit,
  onDelete,
}: ListingManagerDashboardProps) {
  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='text-xl font-bold'>Listings (productos)</h2>
          <p className='text-sm text-muted-foreground'>Creá, editá y publicá listings con borradores.</p>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => onCreateListing('product')}>
            <Plus className='size-4' />
            Product
          </Button>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => onCreateListing('service')}>
            <Plus className='size-4' />
            Service
          </Button>
          <Button type='button' variant='secondary' className='gap-2' onClick={() => onCreateListing('property')}>
            <Plus className='size-4' />
            Property
          </Button>
        </div>
      </div>

      {categoriesLoading ? (
        <div className='space-y-3 rounded-lg border p-4'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      ) : categoriesError ? (
        <Card className='border-destructive/50'>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{categoriesError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Separator />

      <ListingTableSection
        title='Drafts'
        loading={managerLoading}
        error={managerError}
        emptyMessage='No tenés borradores todavía.'
        rows={drafts}
        byId={byId}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <Separator />

      <ListingTableSection
        title='Published Listings'
        loading={managerLoading}
        showModeration
        emptyMessage='No tenés publicaciones publicadas.'
        rows={published}
        byId={byId}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

function ListingTableSection({
  title,
  loading,
  error,
  emptyMessage,
  rows,
  byId,
  showModeration = false,
  onEdit,
  onDelete,
}: {
  title: string
  loading: boolean
  error?: string | null
  emptyMessage: string
  rows: ListingManagerRow[]
  byId: Map<string, CategoryRow>
  showModeration?: boolean
  onEdit: (row: ListingManagerRow) => void
  onDelete: (row: ListingManagerRow) => void
}) {
  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{title}</h3>

      {loading ? (
        <div className='space-y-3 rounded-lg border p-4'>
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      ) : error ? (
        <p className='text-sm text-destructive'>{error}</p>
      ) : rows.length === 0 ? (
        <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>{emptyMessage}</div>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='min-w-full border-separate border-spacing-0'>
            <thead className='bg-muted/40'>
              <tr className='text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                <th className='px-4 py-3'>Title</th>
                <th className='px-4 py-3'>Category</th>
                {showModeration ? <th className='px-4 py-3'>Moderation</th> : null}
                <th className='px-4 py-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='border-t'>
                  <td className='px-4 py-3'>
                    <span className='font-medium'>{row.title ?? '(Sin título)'}</span>
                  </td>
                  <td className='px-4 py-3 text-sm text-muted-foreground'>
                    {row.categoryId ? (byId.get(row.categoryId)?.name ?? row.categoryId) : '—'}
                  </td>
                  {showModeration ? (
                    <td className='px-4 py-3'>
                      <div className='space-y-1'>
                        <Badge
                          variant='secondary'
                          className={cn(
                            'border-transparent',
                            LISTING_MODERATION_PRESENTATION[row.moderationStatus].className,
                          )}
                        >
                          {LISTING_MODERATION_PRESENTATION[row.moderationStatus].label}
                        </Badge>
                        {row.moderationStatus === 'rejected' && row.moderationReason ? (
                          <p className='text-xs text-muted-foreground'>{row.moderationReason}</p>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  <td className='px-4 py-3'>
                    <div className='flex justify-end gap-2'>
                      <Button variant='ghost' size='icon' onClick={() => onEdit(row)} aria-label={`Edit ${title}`}>
                        <PencilLine className='size-4' />
                      </Button>
                      <Button variant='ghost' size='icon' onClick={() => onDelete(row)} aria-label={`Delete ${title}`}>
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
