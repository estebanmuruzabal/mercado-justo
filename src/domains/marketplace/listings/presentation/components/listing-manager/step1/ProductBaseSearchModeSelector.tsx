import { Camera, Search } from 'lucide-react'

import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/utils/utils'

export type ProductBaseSearchMode = 'name' | 'photo'

export function ProductBaseSearchModeSelector({
  value,
  onChange,
  disabled,
}: {
  value: ProductBaseSearchMode
  onChange: (mode: ProductBaseSearchMode) => void
  disabled?: boolean
}) {
  return (
    <div role='tablist' aria-label='Método de búsqueda' className='grid grid-cols-2 gap-3'>
      <button
        type='button'
        role='tab'
        aria-selected={value === 'name'}
        disabled={disabled}
        onClick={() => onChange('name')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-background p-4 text-center transition-colors',
          value === 'name' ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
          disabled && 'opacity-60',
        )}
      >
        <Search className='size-6' aria-hidden />
        <span className='text-sm font-medium'>Por palabras clave</span>
      </button>

      <button
        type='button'
        role='tab'
        aria-selected={value === 'photo'}
        disabled={disabled}
        onClick={() => onChange('photo')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-background p-4 text-center transition-colors',
          value === 'photo' ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
          disabled && 'opacity-60',
        )}
      >
        <Badge className='absolute right-2 top-2 px-1.5 py-0 text-[10px]'>Nuevo</Badge>
        <Camera className='size-6' aria-hidden />
        <span className='text-sm font-medium'>Por foto</span>
      </button>
    </div>
  )
}
