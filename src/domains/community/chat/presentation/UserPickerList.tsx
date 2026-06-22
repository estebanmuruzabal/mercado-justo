'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'

import { searchMessageableUsersAction } from '@/domains/community/chat/application/actions/messages.actions'
import type { MessageableUserDto } from '@/domains/community/chat/application/dto/messageable-user.dto'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils/utils'

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function UserPickerList({
  onSelect,
}: {
  onSelect: (user: MessageableUserDto) => void
}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [users, setUsers] = useState<MessageableUserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setUsers([])
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const results = await searchMessageableUsersAction(debouncedQuery)
        if (!cancelled) setUsers(results)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo buscar usuarios.')
          setUsers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Buscar por nombre o email…'
          className='pl-9'
        />
      </div>

      {loading ? (
        <div className='flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground'>
          <Loader2 className='size-4 animate-spin' />
          Buscando…
        </div>
      ) : null}

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      {!loading && debouncedQuery.length >= 2 && users.length === 0 && !error ? (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          No encontramos usuarios que acepten mensajes con ese nombre.
        </p>
      ) : null}

      {debouncedQuery.length < 2 ? (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          Escribí al menos 2 caracteres para buscar.
        </p>
      ) : null}

      <ul className='max-h-[50vh] space-y-1 overflow-y-auto'>
        {users.map((user) => (
          <li key={user.id}>
            <button
              type='button'
              onClick={() => onSelect(user)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted',
              )}
            >
              <Avatar className='size-10'>
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                ) : null}
                <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{user.displayName}</p>
                {user.locationLabel ? (
                  <p className='truncate text-xs text-muted-foreground'>{user.locationLabel}</p>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
