import { StaticPageShell } from '@/components/layout/static-page-shell'

export const metadata = {
  title: 'Política de privacidad',
}

export default function PrivacyPage() {
  return (
    <StaticPageShell title='Política de privacidad'>
      <div className='space-y-4 text-sm leading-relaxed text-muted-foreground'>
        <p>
          Recopilamos datos necesarios para operar la plataforma: información de cuenta, pedidos,
          preferencias de entrega y comunicaciones con vendedores.
        </p>
        <p>
          No vendemos tus datos personales. Usamos proveedores de infraestructura (hosting,
          autenticación y email transaccional) bajo acuerdos de confidencialidad.
        </p>
        <p>
          Podés solicitar acceso, corrección o eliminación de tus datos contactándonos desde la
          sección de contacto.
        </p>
        <p>
          Este documento es un borrador operativo. Antes del lanzamiento público debe ser revisado
          por asesoría legal.
        </p>
      </div>
    </StaticPageShell>
  )
}
