export default function VendorProfileLoading() {
  return (
    <main className='min-h-screen bg-neutral-50 pb-16'>
      <div className='h-44 w-full animate-pulse bg-neutral-200 sm:h-60 md:h-72' />
      <div className='mx-auto max-w-5xl px-4'>
        <div className='-mt-12 flex items-end gap-4 sm:-mt-14'>
          <div className='h-24 w-24 shrink-0 animate-pulse rounded-full border-4 border-white bg-neutral-300 sm:h-28 sm:w-28' />
          <div className='space-y-2 pb-2'>
            <div className='h-6 w-48 animate-pulse rounded bg-neutral-300' />
            <div className='h-4 w-24 animate-pulse rounded bg-neutral-200' />
          </div>
        </div>
        <div className='mt-4 h-4 w-2/3 max-w-md animate-pulse rounded bg-neutral-200' />
        <div className='mt-4 flex gap-4'>
          <div className='h-4 w-24 animate-pulse rounded bg-neutral-200' />
          <div className='h-4 w-28 animate-pulse rounded bg-neutral-200' />
          <div className='h-4 w-32 animate-pulse rounded bg-neutral-200' />
        </div>
      </div>

      <div className='mx-auto mt-8 max-w-5xl px-4'>
        <div className='mb-6 flex gap-4 border-b border-neutral-200 pb-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-5 w-20 animate-pulse rounded bg-neutral-200' />
          ))}
        </div>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='overflow-hidden rounded-2xl border border-neutral-200 bg-white'>
              <div className='aspect-square animate-pulse bg-neutral-200' />
              <div className='space-y-2 p-3'>
                <div className='h-4 w-3/4 animate-pulse rounded bg-neutral-200' />
                <div className='h-3 w-1/2 animate-pulse rounded bg-neutral-200' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
