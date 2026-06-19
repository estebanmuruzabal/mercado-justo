import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

export function ProductBaseNameSearchPanel({
  query,
  onQueryChange,
  disabled,
}: {
  query: string
  onQueryChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <Label htmlFor='product-base-search-input'>Buscar por nombre</Label>
        <p className='text-sm text-muted-foreground'>
          Escribí el nombre, la marca y otras características del producto. Cuantos más detalles sumes, mejores van a
          ser los resultados.
        </p>
      </div>

      <Input
        id='product-base-search-input'
        value={query}
        disabled={disabled}
        placeholder='Ej.: Tomate redondo orgánico'
        onChange={(event) => onQueryChange(event.target.value)}
        autoComplete='off'
      />
    </div>
  )
}
