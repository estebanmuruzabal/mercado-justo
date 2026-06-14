import type { ReactNode } from 'react'

export function StaticPageShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10'>
      <header className='mb-8 space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>{title}</h1>
        {description ? <p className='text-muted-foreground'>{description}</p> : null}
      </header>
      <div className='prose prose-neutral max-w-none text-foreground'>{children}</div>
    </main>
  )
}
