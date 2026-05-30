import { StaticPageShell } from '@/components/layout/static-page-shell'

export const metadata = {
  title: 'Términos y condiciones',
}

export default function TermsPage() {
  return (
    <StaticPageShell title='Términos y condiciones'>
      <div className='space-y-4 text-sm leading-relaxed text-muted-foreground'>
        <p>
          Al usar Mercado Justo aceptás estos términos. La plataforma conecta compradores y
          vendedores locales; cada vendedor es responsable de sus productos, precios y entregas.
        </p>
        <p>
          Nos reservamos el derecho de suspender cuentas o publicaciones que incumplan las normas
          de la comunidad o la legislación aplicable.
        </p>
        <p>
          Este documento es un borrador operativo. Antes del lanzamiento público debe ser revisado
          por asesoría legal.
        </p>
      </div>
    </StaticPageShell>
  )
}
