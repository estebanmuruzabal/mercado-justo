'use client'

import type { ReactNode } from 'react'

export function CheckoutPageLayout({
  title,
  subtitle,
  children,
  summaryBar,
  summaryBarDesktop,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  summaryBar: ReactNode
  summaryBarDesktop?: ReactNode
}) {
  const desktopSummary = summaryBarDesktop ?? summaryBar
  return (
    <main className='min-h-screen bg-neutral-50 pb-36 lg:pb-10'>
      <div className='mx-auto max-w-2xl px-4 py-6 lg:max-w-5xl lg:px-8 lg:py-10'>
        <div className='mb-6 space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>{title}</h1>
          {subtitle ? <p className='text-sm text-neutral-600'>{subtitle}</p> : null}
        </div>

        <div className='lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8'>
          <div className='space-y-4'>{children}</div>
          <div className='hidden lg:block lg:sticky lg:top-24'>{desktopSummary}</div>
        </div>
      </div>

      <div className='fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden'>
        {summaryBar}
      </div>
    </main>
  )
}
