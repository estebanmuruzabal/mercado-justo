import { Skeleton } from '@/shared/ui/skeleton'
import { KpiCardSkeleton } from '@/shared/admin-ui/ui/KpiCard'

export default function AdminLoading() {
  return (
    <div className='mx-auto max-w-7xl'>
      <div className='mb-6 space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
