import type { FulfillmentPreviewWindowDto } from '@/domains/logistics/application/dto/vendor-fulfillment.dto'
import { cn } from '@/shared/utils/utils'

export function FulfillmentWindowChip({
  window,
  className,
}: {
  window: FulfillmentPreviewWindowDto
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-background px-3 py-2 text-sm shadow-sm',
        window.kind === 'pickup' ? 'border-indigo-200' : 'border-amber-200',
        className,
      )}
    >
      <div className='font-medium'>{window.label}</div>
      <div className='text-xs text-muted-foreground'>
        {window.dayLabel} · {window.timeRange}
      </div>
    </div>
  )
}
