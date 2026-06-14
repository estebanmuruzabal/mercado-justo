import type { FulfillmentMethodKind, FulfillmentMethodProvider } from '@/domains/logistics/domain/types'
import { cn } from '@/shared/utils/utils'

function providerLabel(provider: FulfillmentMethodProvider) {
  return provider === 'dittovan' ? 'DittoVan' : 'Propio'
}

export function FulfillmentMethodBadge({
  label,
  kind,
  provider,
  isDefault = false,
  className,
}: {
  label: string
  kind: FulfillmentMethodKind
  provider: FulfillmentMethodProvider
  isDefault?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        isDefault ? 'border-primary bg-primary/10 text-primary' : 'bg-muted text-foreground',
        className,
      )}
    >
      <span>{label}</span>
      <span className='text-muted-foreground'>
        {kind === 'pickup' ? 'Pickup' : 'Delivery'} · {providerLabel(provider)}
      </span>
      {isDefault ? <span className='font-semibold'>Default</span> : null}
    </span>
  )
}
