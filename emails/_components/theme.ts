/** Brand tokens for React Email (inline styles; email clients ignore CSS variables). */
export const emailTheme = {
  brandName: 'Mercado Justo',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  colors: {
    background: '#f4f4f5',
    card: '#ffffff',
    cardDark: '#1c1c1e',
    foreground: '#18181b',
    foregroundMuted: '#71717a',
    foregroundLight: '#fafafa',
    primary: '#18181b',
    primaryForeground: '#fafafa',
    border: '#e4e4e7',
    borderDark: '#3f3f46',
    accent: '#16a34a',
    destructive: '#dc2626',
  },
  radius: '10px',
} as const
