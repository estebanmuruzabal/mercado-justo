import { Heading, Text } from '@react-email/components'

import { EmailButton } from './_components/EmailButton'
import { EmailLayout } from './_components/EmailLayout'
import { emailTheme } from './_components/theme'

export type ModerationAlertEmailProps = {
  recipientName: string
  entityType: string
  entityTitle: string
  reason: string
  actionUrl: string
}

export function ModerationAlertEmail({
  recipientName,
  entityType,
  entityTitle,
  reason,
  actionUrl,
}: ModerationAlertEmailProps) {
  return (
    <EmailLayout preview={`Acción requerida: ${entityTitle}`}>
      <Heading
        className="email-text"
        style={{ fontSize: '22px', fontWeight: 700, color: emailTheme.colors.destructive, margin: '0 0 16px' }}
      >
        Alerta de moderación
      </Heading>
      <Text className="email-text" style={{ fontSize: '15px', lineHeight: '24px', color: emailTheme.colors.foreground, margin: '0 0 12px' }}>
        Hola {recipientName}, tu {entityType} <strong>{entityTitle}</strong> requiere atención.
      </Text>
      <Text className="email-muted" style={{ fontSize: '14px', lineHeight: '22px', color: emailTheme.colors.foregroundMuted, margin: '0 0 16px' }}>
        Motivo: {reason}
      </Text>
      <EmailButton href={actionUrl}>Ver detalle</EmailButton>
    </EmailLayout>
  )
}

export default ModerationAlertEmail

ModerationAlertEmail.PreviewProps = {
  recipientName: 'Juan',
  entityType: 'publicación',
  entityTitle: 'Tomates cherry orgánicos',
  reason: 'La imagen no cumple con las políticas de contenido.',
  actionUrl: 'https://mercadojusto.app/dashboard-vendor/listings',
} satisfies ModerationAlertEmailProps
