import { requireSuperAdmin } from '@/server/auth/require-staff'
import { listUsersForAdmin } from '@/server/queries/admin/users.queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { UsersTable } from '@/components/admin/users/UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireSuperAdmin()
  const users = await listUsersForAdmin()

  return (
    <div className='mx-auto max-w-7xl'>
      <PageHeader
        title='Usuarios'
        description={`${users.length} usuarios de plataforma (excluye vendedores).`}
      />
      <UsersTable users={users} />
    </div>
  )
}
