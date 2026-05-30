import { Heading, Text } from '@react-email/components'

import { EmailButton } from './_components/EmailButton'
import { EmailLayout } from './_components/EmailLayout'
import { emailTheme } from './_components/theme'

export type DeliveryIncidentEmailProps = {
  recipientName: string
  orderId: string
  incidentDescription: string
  supportUrl: string
}

export function DeliveryIncidentEmail({
  recipientName,
  orderId,
  incidentDescription,
  supportUrl,
}: DeliveryIncidentEmailProps) {
  return (
    <EmailLayout preview="Incidencia en tu envío">
      <Heading
        className="email-text"
        style={{ fontSize: '22px', fontWeight: 700, color: emailTheme.colors.destructive, margin: '0 0 16px' }}
      >
        Incidencia logística
      </Heading>
      <Text className="email-text" style={{ fontSize: '15px', lineHeight: '24px', color: emailTheme.colors.foreground, margin: '0 0 12px' }}>
        Hola {recipientName}, hubo un inconveniente con el envío de tu pedido <strong>{orderId.slice(0, 8)}…</strong>.
      </Text>
      <Text className="email-muted" style={{ fontSize: '14px', lineHeight: '22px', color: emailTheme.colors.foregroundMuted, margin: '0 0 16px' }}>
        {incidentDescription}
      </Text>
      <EmailButton href={supportUrl}>Ver estado del pedido</EmailButton>
    </EmailLayout>
  )
}

export default DeliveryIncidentEmail

DeliveryIncidentEmail.PreviewProps = {
  recipientName: 'María',
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  incidentDescription: 'El envío está demorado por condiciones logísticas. Te avisamos cuando haya novedades.',
  supportUrl: 'https://mercadojusto.app/profile/sales',
} satisfies DeliveryIncidentEmailProps
