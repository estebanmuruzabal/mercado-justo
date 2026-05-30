import Link from 'next/link'

import { formatBuildTime, getBuildInfo } from '@/lib/build-info'
import { FOOTER_NAV_LINKS } from './footer-links'

export function AppFooter() {
  const { version, commitSha, buildTime, deployLabel } = getBuildInfo()

  return (
    <footer className='mt-auto border-t border-border bg-muted/30'>
      <div className='mx-auto max-w-[1760px] px-4 py-10 sm:px-6 lg:px-10'>
        <div className='flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-3'>
            <p className='text-sm font-semibold tracking-tight'>Mercado Justo</p>
            <p className='max-w-md text-sm text-muted-foreground'>
              Comprá y vendé productos locales con confianza.
            </p>
          </div>

          <nav aria-label='Enlaces del sitio'>
            <ul className='grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-2'>
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
          <p>© {new Date().getFullYear()} Mercado Justo. Todos los derechos reservados.</p>
          <p className='font-mono tabular-nums'>
            v{version} · {commitSha} · {formatBuildTime(buildTime)} · {deployLabel}
          </p>
        </div>
      </div>
    </footer>
  )
}
