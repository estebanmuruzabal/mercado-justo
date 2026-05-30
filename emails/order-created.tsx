import { Heading, Text } from '@react-email/components'

import { EmailButton } from './_components/EmailButton'
import { EmailLayout } from './_components/EmailLayout'
import { emailTheme } from './_components/theme'

export type OrderCreatedEmailProps = {
  buyerName: string
  orderId: string
  storeName: string
  total: string
  orderUrl: string
}

export function OrderCreatedEmail({
  buyerName,
  orderId,
  storeName,
  total,
  orderUrl,
}: OrderCreatedEmailProps) {
  return (
    <EmailLayout preview={`Tu pedido en ${storeName} fue confirmado`}>
      <Heading
        className="email-text"
        style={{ fontSize: '22px', fontWeight: 700, color: emailTheme.colors.foreground, margin: '0 0 16px' }}
      >
        Pedido confirmado
      </Heading>
      <Text className="email-text" style={{ fontSize: '15px', lineHeight: '24px', color: emailTheme.colors.foreground, margin: '0 0 12px' }}>
        Hola {buyerName}, tu compra en <strong>{storeName}</strong> fue registrada correctamente.
      </Text>
      <Text className="email-muted" style={{ fontSize: '14px', lineHeight: '22px', color: emailTheme.colors.foregroundMuted, margin: '0 0 8px' }}>
        Nº de pedido: <strong>{orderId.slice(0, 8)}…</strong>
        <br />
        Total: <strong>{total}</strong>
      </Text>
      <EmailButton href={orderUrl}>Ver mi pedido</EmailButton>
    </EmailLayout>
  )
}

export default OrderCreatedEmail

OrderCreatedEmail.PreviewProps = {
  buyerName: 'María',
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  storeName: 'Verdulería El Parque',
  total: '$ 12.500',
  orderUrl: 'https://mercadojusto.app/profile/sales',
} satisfies OrderCreatedEmailProps
