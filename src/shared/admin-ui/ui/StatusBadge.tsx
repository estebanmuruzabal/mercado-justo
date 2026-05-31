import { type StatusPresentation } from '@/shared/utils/admin-status-presentation'
import { cn } from '@/shared/utils/utils'

export function StatusBadge({
  presentation,
  className,
}: {
  presentation: StatusPresentation
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        presentation.className,
        className,
      )}
    >
      {presentation.label}
    </span>
  )
}
