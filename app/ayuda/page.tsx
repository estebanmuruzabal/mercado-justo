import { StaticPageShell } from '@/components/layout/static-page-shell'
import { CONTACT_PATH } from '@/lib/routes'
import Link from 'next/link'

export const metadata = {
  title: 'Ayuda',
  description: 'Preguntas frecuentes y soporte de Mercado Justo.',
}

export default function HelpPage() {
  return (
    <StaticPageShell
      title='Ayuda'
      description='Respuestas rápidas para compradores y vendedores.'
    >
      <div className='space-y-6 text-sm leading-relaxed text-muted-foreground'>
        <section className='space-y-2'>
          <h2 className='text-base font-medium text-foreground'>¿Cómo compro?</h2>
          <p>
            Explorá productos desde la home, agregá al carrito y completá el checkout con tu
            cuenta. Podés elegir envío o retiro según lo que ofrezca cada vendedor.
          </p>
        </section>
        <section className='space-y-2'>
          <h2 className='text-base font-medium text-foreground'>¿Cómo vendo?</h2>
          <p>
            Creá tu cuenta, activá tu tienda desde el panel de vendedor y publicá tus productos.
            Cuando recibas un pedido, vas a ver la notificación en tu panel.
          </p>
        </section>
        <section className='space-y-2'>
          <h2 className='text-base font-medium text-foreground'>¿Necesitás más ayuda?</h2>
          <p>
            Escribinos desde la página de{' '}
            <Link href={CONTACT_PATH} className='text-primary hover:underline'>
              contacto
            </Link>
            .
          </p>
        </section>
      </div>
    </StaticPageShell>
  )
}
