import { Heading, Text } from '@react-email/components'

import { EmailButton } from './_components/EmailButton'
import { EmailLayout } from './_components/EmailLayout'
import { emailTheme } from './_components/theme'

export type PasswordResetEmailProps = {
  resetUrl: string
  expiresInMinutes?: number
}

export function PasswordResetEmail({ resetUrl, expiresInMinutes = 60 }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Restablecé tu contraseña en Mercado Justo">
      <Heading
        className="email-text"
        style={{ fontSize: '22px', fontWeight: 700, color: emailTheme.colors.foreground, margin: '0 0 16px' }}
      >
        Restablecer contraseña
      </Heading>
      <Text className="email-text" style={{ fontSize: '15px', lineHeight: '24px', color: emailTheme.colors.foreground, margin: '0 0 12px' }}>
        Recibimos una solicitud para cambiar la contraseña de tu cuenta. Si no fuiste vos, podés ignorar este email.
      </Text>
      <Text className="email-muted" style={{ fontSize: '13px', lineHeight: '20px', color: emailTheme.colors.foregroundMuted, margin: '0 0 16px' }}>
        El enlace vence en {expiresInMinutes} minutos.
      </Text>
      <EmailButton href={resetUrl}>Restablecer contraseña</EmailButton>
    </EmailLayout>
  )
}

export default PasswordResetEmail

PasswordResetEmail.PreviewProps = {
  resetUrl: 'https://mercadojusto.app/reset-password',
  expiresInMinutes: 60,
} satisfies PasswordResetEmailProps
