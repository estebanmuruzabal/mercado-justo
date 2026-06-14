import { NextResponse } from 'next/server'

import { getBuildInfo } from '@/shared/utils/build-info'

export const dynamic = 'force-static'

/** Public build metadata — useful to verify the deployed version from the browser or CI. */
export function GET() {
  return NextResponse.json(getBuildInfo(), {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
