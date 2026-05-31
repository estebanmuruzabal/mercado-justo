import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'

import { requirePermission } from '@/shared/auth/guards/require-staff'
import { PERMISSIONS } from '@/shared/auth/permissions'
import { getOpsAlerts } from '@/domains/community/notifications/application/queries/admin-notifications.queries'
import { countBySeverity, type AlertSeverity } from '@/domains/community/notifications/domain/notification-engine'
import { Card, CardContent } from '@/shared/ui/card'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { KpiCard } from '@/shared/admin-ui/ui/KpiCard'
import { formatNumber, formatRelativeTime } from '@/shared/utils/admin-format'
import { cn } from '@/shared/utils/utils'

export const dynamic = 'force-dynamic'

const SEVERITY_STYLES: Record<AlertSeverity, { dot: string; label: string }> = {
  critical: { dot: 'bg-rose-500', label: 'Crítico' },
  warning: { dot: 'bg-amber-500', label: 'Advertencia' },
  info: { dot: 'bg-sky-500', label: 'Informativo' },
}

export default async function AdminNotificationsPage() {
  await requirePermission(PERMISSIONS.NOTIFICATIONS_VIEW)
  const alerts = await getOpsAlerts()
  const counts = countBySeverity(alerts)

  return (
    <div className='mx-auto max-w-5xl space-y-6'>
      <PageHeader
        title='Notificaciones'
        description='Centro operativo de alertas: incidencias, pedidos trabados, pagos fallidos y vendors inactivos.'
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <KpiCard label='Críticas' value={formatNumber(counts.critical)} icon={AlertOctagon} accentClass='bg-rose-100 text-rose-700' />
        <KpiCard label='Advertencias' value={formatNumber(counts.warning)} icon={AlertTriangle} accentClass='bg-amber-100 text-amber-700' />
        <KpiCard label='Informativas' value={formatNumber(counts.info)} icon={Info} accentClass='bg-sky-100 text-sky-700' />
      </div>

      <Card>
        <CardContent className='p-0'>
          {alerts.length === 0 ? (
            <div className='flex h-32 items-center justify-center text-muted-foreground'>
              Todo en orden. No hay alertas operativas.
            </div>
          ) : (
            <ul className='divide-y'>
              {alerts.map((a) => (
                <li key={a.id} className='flex items-start gap-3 px-5 py-4'>
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_STYLES[a.severity].dot)} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium'>{a.title}</span>
                      <span className='shrink-0 text-xs text-muted-foreground'>{formatRelativeTime(a.createdAt)}</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>{a.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
