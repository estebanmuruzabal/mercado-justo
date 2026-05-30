import { requirePermission } from '@/server/auth/require-staff'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { listReportsForAdmin } from '@/server/queries/admin/moderation.queries'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import { REPORT_STATUS_PRESENTATION } from '@/lib/admin/status-presentation'
import { formatDateTime } from '@/lib/admin/format'

export const dynamic = 'force-dynamic'

const ENTITY_LABELS: Record<string, string> = {
  listing: 'Producto',
  vendor: 'Vendor',
  review: 'Reseña',
  profile: 'Perfil',
}

export default async function AdminModerationPage() {
  await requirePermission(PERMISSIONS.REPORTS_VIEW)
  const reports = await listReportsForAdmin()

  return (
    <div className='mx-auto max-w-7xl space-y-4'>
      <PageHeader
        title='Moderación'
        description='Cola de reportes sobre vendors, productos, reseñas y perfiles públicos.'
      />

      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      No hay reportes pendientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className='font-medium'>{ENTITY_LABELS[r.entityType] ?? r.entityType}</TableCell>
                      <TableCell className='max-w-[320px]'>
                        <div className='truncate'>{r.reason}</div>
                        {r.details ? <div className='truncate text-xs text-muted-foreground'>{r.details}</div> : null}
                      </TableCell>
                      <TableCell className='text-sm'>{r.reporterName}</TableCell>
                      <TableCell>
                        <StatusBadge presentation={REPORT_STATUS_PRESENTATION[r.status]} />
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{formatDateTime(r.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
