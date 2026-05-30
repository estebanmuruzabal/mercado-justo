import { Heading, Text } from '@react-email/components'

import { EmailButton } from './_components/EmailButton'
import { EmailLayout } from './_components/EmailLayout'
import { emailTheme } from './_components/theme'

export type VendorApprovedEmailProps = {
  vendorName: string
  storeName: string
  dashboardUrl: string
}

export function VendorApprovedEmail({ vendorName, storeName, dashboardUrl }: VendorApprovedEmailProps) {
  return (
    <EmailLayout preview={`Tu tienda ${storeName} fue aprobada`}>
      <Heading
        className="email-text"
        style={{ fontSize: '22px', fontWeight: 700, color: emailTheme.colors.foreground, margin: '0 0 16px' }}
      >
        ¡Tu tienda está activa!
      </Heading>
      <Text className="email-text" style={{ fontSize: '15px', lineHeight: '24px', color: emailTheme.colors.foreground, margin: '0 0 12px' }}>
        Hola {vendorName}, <strong>{storeName}</strong> fue aprobada en Mercado Justo. Ya podés publicar productos y recibir pedidos.
      </Text>
      <EmailButton href={dashboardUrl}>Ir al panel de vendedor</EmailButton>
    </EmailLayout>
  )
}

export default VendorApprovedEmail

VendorApprovedEmail.PreviewProps = {
  vendorName: 'Juan',
  storeName: 'Verdulería El Parque',
  dashboardUrl: 'https://mercadojusto.app/dashboard-vendor',
} satisfies VendorApprovedEmailProps
