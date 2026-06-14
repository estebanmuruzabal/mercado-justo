'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { History, MoreHorizontal, Search } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { StatusBadge } from '@/shared/admin-ui/ui/StatusBadge'
import {
  ROLE_LABELS,
  USER_STATUS_PRESENTATION,
} from '@/shared/utils/admin-status-presentation'
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/shared/utils/admin-format'
import { ROLES, ROLE_LIST, type Role } from '@/domains/users/domain/roles'
import type { AdminUserRow } from '@/domains/users/application/queries/admin-users.queries'
import type { AdminAuditLogRow } from '@/domains/users/application/queries/admin-users.queries'
import {
  banUserAction,
  changeUserRoleAction,
  deleteUserAction,
  getUserActivityAction,
  reactivateUserAction,
  suspendUserAction,
  updateUserAction,
} from '@/domains/users/application/actions/admin-user.actions'

type FilterKey = 'all' | 'buyers' | 'moderators' | 'suspended' | 'active'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'buyers', label: 'Buyers' },
  { key: 'moderators', label: 'Moderadores' },
  { key: 'suspended', label: 'Suspendidos' },
  { key: 'active', label: 'Activos' },
]

const MANAGEABLE_ROLES = ROLE_LIST.filter(
  (r) => r !== ROLES.SELLER && r !== ROLES.SELLER_ADMIN && r !== ROLES.PROPERTY_ADMIN,
)

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [viewTarget, setViewTarget] = useState<AdminUserRow | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null)
  const [roleTarget, setRoleTarget] = useState<AdminUserRow | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AdminUserRow | null>(null)
  const [activityTarget, setActivityTarget] = useState<AdminUserRow | null>(null)
  const [activityRows, setActivityRows] = useState<AdminAuditLogRow[]>([])
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>(ROLES.USER)
  const [reason, setReason] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (filter === 'buyers' && u.role !== ROLES.USER) return false
      if (filter === 'moderators' && u.role !== ROLES.MODERATOR) return false
      if (filter === 'suspended' && u.status === 'active') return false
      if (filter === 'active' && u.status !== 'active') return false
      if (!q) return true
      return (
        (u.fullName?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [users, search, filter])

  function run(action: () => Promise<{ success: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await action()
      if (res.success) {
        toast.success(okMsg)
        router.refresh()
      } else {
        toast.error(res.error ?? 'No se pudo completar la acción.')
      }
    })
  }

  function openEdit(user: AdminUserRow) {
    setEditTarget(user)
    setEditName(user.fullName ?? '')
    setEditEmail(user.email ?? '')
  }

  function openRole(user: AdminUserRow) {
    setRoleTarget(user)
    setNewRole(user.role)
  }

  function confirmEdit() {
    if (!editTarget) return
    const target = editTarget
    run(
      () =>
        updateUserAction({
          userId: target.id,
          fullName: editName,
          email: editEmail,
        }),
      'Usuario actualizado.',
    )
    setEditTarget(null)
  }

  function confirmRole() {
    if (!roleTarget) return
    const target = roleTarget
    run(
      () => changeUserRoleAction({ userId: target.id, role: newRole }),
      'Rol actualizado.',
    )
    setRoleTarget(null)
  }

  function confirmSuspend() {
    if (!suspendTarget) return
    const target = suspendTarget
    const value = reason
    setSuspendTarget(null)
    setReason('')
    run(
      () => suspendUserAction({ userId: target.id, reason: value }),
      'Usuario suspendido.',
    )
  }

  function loadActivity(user: AdminUserRow) {
    setActivityTarget(user)
    setActivityRows([])
    startTransition(async () => {
      const rows = await getUserActivityAction(user.id)
      setActivityRows(rows)
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar por nombre o email...'
            className='pl-9'
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <SelectTrigger className='w-full sm:w-48'>
            <SelectValue placeholder='Filtro' />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-xl border bg-card'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-right'>$ gastado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                    No hay usuarios que coincidan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className='font-medium'>{u.fullName ?? '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>{u.email ?? '—'}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge presentation={USER_STATUS_PRESENTATION[u.status]} />
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      <div>{formatCurrency(u.totalSpent)}</div>
                      <div className='text-xs text-muted-foreground'>
                        {u.orderCount} {u.orderCount === 1 ? 'compra' : 'compras'}
                      </div>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatRelativeTime(u.lastAccessAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' disabled={isPending}>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => setViewTarget(u)}>
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            Editar usuario
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRole(u)}>
                            Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.status === 'active' ? (
                            <DropdownMenuItem
                              className='text-rose-600'
                              onClick={() => {
                                setSuspendTarget(u)
                                setReason('')
                              }}
                            >
                              Suspender cuenta
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => run(() => reactivateUserAction(u.id), 'Usuario reactivado.')}
                            >
                              Reactivar cuenta
                            </DropdownMenuItem>
                          )}
                          {u.status !== 'banned' ? (
                            <DropdownMenuItem
                              className='text-rose-600'
                              onClick={() => run(() => banUserAction(u.id), 'Usuario baneado.')}
                            >
                              Banear cuenta
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className='text-rose-600'
                            onClick={() => {
                              if (confirm(`¿Eliminar permanentemente a ${u.email ?? u.fullName}?`)) {
                                run(() => deleteUserAction(u.id), 'Usuario eliminado.')
                              }
                            }}
                          >
                            Eliminar cuenta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => loadActivity(u)}>
                            <History className='mr-2 h-4 w-4' /> Ver historial de actividad
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(viewTarget)} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil de usuario</DialogTitle>
          </DialogHeader>
          {viewTarget ? (
            <dl className='space-y-2 text-sm'>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Nombre</dt>
                <dd className='font-medium'>{viewTarget.fullName ?? '—'}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Email</dt>
                <dd>{viewTarget.email ?? '—'}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Rol</dt>
                <dd>{ROLE_LABELS[viewTarget.role] ?? viewTarget.role}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Estado</dt>
                <dd>
                  <StatusBadge presentation={USER_STATUS_PRESENTATION[viewTarget.status]} />
                </dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-muted-foreground'>Total gastado</dt>
                <dd>{formatCurrency(viewTarget.totalSpent)}</dd>
              </div>
              {viewTarget.suspensionReason ? (
                <div>
                  <dt className='text-muted-foreground'>Motivo suspensión</dt>
                  <dd className='mt-1 text-rose-600'>{viewTarget.suspensionReason}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label htmlFor='edit-name'>Nombre</Label>
              <Input id='edit-name' value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='edit-email'>Email</Label>
              <Input id='edit-email' value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={confirmEdit}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(roleTarget)} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              {roleTarget ? `Rol actual: ${ROLE_LABELS[roleTarget.role] ?? roleTarget.role}` : ''}
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANAGEABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRoleTarget(null)}>
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={confirmRole}>
              Actualizar rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(suspendTarget)} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender cuenta</DialogTitle>
            <DialogDescription>
              {suspendTarget
                ? `Vas a suspender a ${suspendTarget.fullName ?? suspendTarget.email}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Motivo de la suspensión...'
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setSuspendTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant='destructive'
              disabled={reason.trim().length < 3 || isPending}
              onClick={confirmSuspend}
            >
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activityTarget)} onOpenChange={(o) => !o && setActivityTarget(null)}>
        <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Historial de actividad</DialogTitle>
            <DialogDescription>
              {activityTarget?.fullName ?? activityTarget?.email ?? 'Usuario'}
            </DialogDescription>
          </DialogHeader>
          {activityRows.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {isPending ? 'Cargando...' : 'Sin actividad registrada.'}
            </p>
          ) : (
            <ul className='space-y-3 text-sm'>
              {activityRows.map((row) => (
                <li key={row.id} className='rounded-lg border p-3'>
                  <div className='font-medium'>{row.action}</div>
                  <div className='text-xs text-muted-foreground'>
                    {formatRelativeTime(row.createdAt)} · {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
