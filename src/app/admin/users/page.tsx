import { requireSuperAdmin } from '@/shared/auth/guards/require-staff'
import { listUsersForAdmin } from '@/domains/users/application/queries/admin-users.queries'
import { PageHeader } from '@/shared/admin-ui/ui/PageHeader'
import { UsersTable } from '@/shared/admin-ui/users/UsersTable'

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
