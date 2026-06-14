import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function DittoBotAuditPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoría DittoBot</CardTitle>
        <CardDescription>
          Resumen de acciones registradas vía withAudit (productos, lotes, asignaciones).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>
          Vista de auditoría consolidada disponible en R6.0e. Las mutaciones actuales ya registran
          eventos en el log de admin audit.
        </p>
      </CardContent>
    </Card>
  )
}
