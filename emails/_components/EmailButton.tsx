import { Button } from '@react-email/components'

import { emailTheme } from './theme'

export function EmailButton({ href, children }: { href: string; children: string }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: emailTheme.colors.primary,
        color: emailTheme.colors.primaryForeground,
        borderRadius: emailTheme.radius,
        fontSize: '14px',
        fontWeight: 600,
        padding: '12px 24px',
        textDecoration: 'none',
        display: 'inline-block',
        marginTop: '8px',
      }}
    >
      {children}
    </Button>
  )
}
