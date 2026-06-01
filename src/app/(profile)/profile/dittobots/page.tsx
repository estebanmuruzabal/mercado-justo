import { listCurrentUserDittoBots } from '@/domains/dittobots/application/queries/user-ditto-bots.queries'
import { MisDittoBotsPanel } from '@/domains/dittobots/presentation/mis-dittobots-panel'

export const dynamic = 'force-dynamic'

export default async function ProfileDittoBotsPage() {
  const devices = await listCurrentUserDittoBots()

  return (
    <div className='mx-auto max-w-3xl px-4 py-8'>
      <MisDittoBotsPanel devices={devices} />
    </div>
  )
}
