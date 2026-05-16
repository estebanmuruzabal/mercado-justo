'use client'

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProductsSearchFields({ variant }: { variant: 'expanded' | 'compact' }) {
  const compact = variant === 'compact'

  return (
    <div className='w-full'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className={compact ? 'sm:col-span-2' : 'sm:col-span-2'}>
          <p className={compact ? 'sr-only' : 'mb-1 text-xs font-semibold text-muted-foreground'}>
            Product name
          </p>
          <Input
            placeholder='ESP32'
            className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
          />
        </div>

        <div>
          <p className={compact ? 'sr-only' : 'mb-1 text-xs font-semibold text-muted-foreground'}>
            {compact ? 'Radius' : 'Search radius/location'}
          </p>
          <Input
            placeholder='20km around Resistencia'
            className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
          />
        </div>
      </div>

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <Button type='button' className={compact ? 'h-11 w-full' : 'h-11 px-6'}>
          <Search className='mr-2 size-4' />
          Search
        </Button>
      </div>
    </div>
  )
}

