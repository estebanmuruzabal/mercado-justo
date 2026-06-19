'use client'

import type { ReactNode } from 'react'

import { QueryProvider } from '@/shared/providers/query-provider'

export function VendorClientProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}
