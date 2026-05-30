import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

import { emailTheme } from './theme'

export type EmailLayoutProps = {
  preview: string
  children: ReactNode
  footerNote?: string
}

export function EmailLayout({ preview, children, footerNote }: EmailLayoutProps) {
  const { colors, fontFamily, brandName } = emailTheme

  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          @media (prefers-color-scheme: dark) {
            .email-body { background-color: ${colors.cardDark} !important; }
            .email-card { background-color: #27272a !important; border-color: ${colors.borderDark} !important; }
            .email-text { color: ${colors.foregroundLight} !important; }
            .email-muted { color: #a1a1aa !important; }
            .email-hr { border-color: ${colors.borderDark} !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="email-body"
        style={{
          backgroundColor: colors.background,
          fontFamily,
          margin: 0,
          padding: '32px 16px',
        }}
      >
        <Container style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Text
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: colors.foreground,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {brandName}
            </Text>
          </Section>

          <Section
            className="email-card"
            style={{
              backgroundColor: colors.card,
              borderRadius: emailTheme.radius,
              border: `1px solid ${colors.border}`,
              padding: '32px 28px',
            }}
          >
            {children}
          </Section>

          <Hr className="email-hr" style={{ borderColor: colors.border, margin: '24px 0' }} />

          <Text
            className="email-muted"
            style={{
              fontSize: '12px',
              color: colors.foregroundMuted,
              textAlign: 'center',
              margin: 0,
              lineHeight: '18px',
            }}
          >
            {footerNote ?? `Este email fue enviado por ${brandName}.`}
            <br />
            <Link
              href="https://mercadojusto.app"
              style={{ color: colors.foregroundMuted, textDecoration: 'underline' }}
            >
              mercadojusto.app
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailLayout
