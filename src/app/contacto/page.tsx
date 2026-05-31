import { StaticPageShell } from '@/shared/shell/layout/static-page-shell'

export const metadata = {
  title: 'Contacto',
}

export default function ContactPage() {
  return (
    <StaticPageShell
      title='Contacto'
      description='Estamos para ayudarte con compras, ventas o soporte técnico.'
    >
      <div className='space-y-4 text-sm leading-relaxed text-muted-foreground'>
        <p>
          Escribinos a{' '}
          <a href='mailto:hola@mercadojusto.com' className='text-primary hover:underline'>
            hola@mercadojusto.com
          </a>{' '}
          y te respondemos a la brevedad.
        </p>
        <p>
          Si tenés un problema con un pedido, incluí el número de orden y el nombre de la tienda
          para agilizar la gestión.
        </p>
      </div>
    </StaticPageShell>
  )
}
