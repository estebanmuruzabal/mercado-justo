'use client'

import { CalendarDays, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PropertiesSearchFields({ variant }: { variant: 'expanded' | 'compact' }) {
  const compact = variant === 'compact'

  return (
    <div className='w-full'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className={compact ? 'sm:col-span-2' : 'sm:col-span-1'}>
          <p className={compact ? 'sr-only' : 'mb-1 text-xs font-semibold text-muted-foreground'}>
            Property type/location
          </p>
          <Input
            placeholder='Apartment'
            className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
          />
        </div>

        {!compact ? (
          <>
            <div>
              <p className='mb-1 text-xs font-semibold text-muted-foreground'>Check-in</p>
              <Input
                placeholder='Check-in'
                className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
              />
            </div>
            <div>
              <p className='mb-1 text-xs font-semibold text-muted-foreground'>Check-out</p>
              <Input
                placeholder='Check-out'
                className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
              />
            </div>
          </>
        ) : (
          <div>
            <p className='sr-only'>Dates</p>
            <div className='flex items-center gap-2 rounded-lg border bg-background/40 px-3 py-2'>
              <CalendarDays className='size-4 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>Dates</span>
            </div>
          </div>
        )}
      </div>

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <p className={compact ? 'sr-only' : 'mb-1 text-xs font-semibold text-muted-foreground'}>
          Search radius
        </p>
        <Input
          placeholder='20km radius'
          className='h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
        />
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

