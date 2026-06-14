import { BUILD_INFO } from './build-info.generated'

export type DeployLabel = 'DEV' | 'PREVIEW' | 'PROD'
export type BuildInfo = typeof BUILD_INFO

/** Immutable metadata baked in at build/dev startup time. */
export function getBuildInfo(): BuildInfo {
  return BUILD_INFO
}

/** Human-readable UTC timestamp for the footer. */
export function formatBuildTime(iso: string, locale = 'es-AR'): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso))

  return `${formatted} UTC`
}
