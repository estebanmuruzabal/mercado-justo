import Link from 'next/link'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingType: string; id: string }>
}) {
  const { listingType, id } = await params
  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        <div>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
            ← Back to home
          </Link>
        </div>

        <div className='space-y-2'>
          <h1 className='text-3xl font-bold'>
            {listingType} #{id}
          </h1>
          <p className='text-muted-foreground'>
            Detail page placeholder. In the next step, we’ll fetch and render the full listing data.
          </p>
        </div>
      </div>
    </main>
  )
}

