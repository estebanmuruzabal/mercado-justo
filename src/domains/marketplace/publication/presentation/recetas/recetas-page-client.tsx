'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { BookOpen, Loader2, Star } from 'lucide-react'

import { createRecipeProtocolAction } from '@/domains/marketplace/publication/application/actions/create-recipe-protocol.actions'
import { rateRecipeProtocolAction } from '@/domains/marketplace/publication/application/actions/rate-recipe-protocol.actions'
import type { RecipeProtocolListItem } from '@/domains/marketplace/publication/application/queries/recipe-protocol.queries'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

function ProtocolCard({ protocol }: { protocol: RecipeProtocolListItem }) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submitRating() {
    setPending(true)
    setMessage(null)
    const result = await rateRecipeProtocolAction({
      publicationId: protocol.id,
      rating,
      body: reviewBody || undefined,
    })
    setPending(false)

    if (!result.success) {
      setMessage(result.error)
      return
    }

    setMessage('Calificación guardada.')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <CardTitle className='text-lg'>{protocol.title ?? 'Sin título'}</CardTitle>
          <div className='flex gap-2'>
            {protocol.isOwn ? <Badge variant='secondary'>Propio</Badge> : null}
            {protocol.isLibrary ? <Badge>Biblioteca</Badge> : null}
          </div>
        </div>
        {protocol.summary ? (
          <CardDescription>{protocol.summary}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <p className='text-muted-foreground'>
          Estado: {protocol.lifecycle} · {protocol.moderationStatus}
        </p>
        <p className='flex items-center gap-1'>
          <Star className='h-4 w-4 fill-amber-400 text-amber-400' />
          {protocol.ratingAvg.toFixed(1)} ({protocol.reviewCount} reseñas)
        </p>
        {protocol.isLibrary && !protocol.isOwn ? (
          <div className='space-y-2 rounded-lg border bg-neutral-50 p-3'>
            <Label>Calificar protocolo</Label>
            <Input
              type='number'
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <Textarea
              placeholder='Comentario (opcional)'
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={2}
            />
            <Button size='sm' disabled={pending} onClick={() => void submitRating()}>
              {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Enviar calificación
            </Button>
            {message ? <p className='text-xs text-muted-foreground'>{message}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function RecetasPageClient({
  protocols,
  canCreate,
}: {
  protocols: RecipeProtocolListItem[]
  canCreate: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [productId, setProductId] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ownProtocols = protocols.filter((p) => p.isOwn)
  const libraryProtocols = protocols.filter((p) => p.isLibrary && !p.isOwn)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const result = await createRecipeProtocolAction({
      title,
      summary: summary || undefined,
      productPublicationId: productId.trim() || undefined,
    })

    setPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setTitle('')
    setSummary('')
    setProductId('')
    router.refresh()
  }

  return (
    <div className='mx-auto max-w-4xl space-y-8 px-4 py-8'>
      <div>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <BookOpen className='h-6 w-6' />
          Protocolos (Recetas)
        </h1>
        <p className='mt-1 text-muted-foreground'>
          Biblioteca Grower — protocolos de cultivo y automatización Ditto.
        </p>
      </div>

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Crear protocolo</CardTitle>
            <CardDescription>Formulario mínimo MVP — borrador privado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className='grid max-w-lg gap-4' onSubmit={(e) => void handleCreate(e)}>
              <div className='grid gap-2'>
                <Label htmlFor='title'>Título</Label>
                <Input
                  id='title'
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='summary'>Resumen (opcional)</Label>
                <Textarea
                  id='summary'
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='product'>Producto vinculado (UUID opcional)</Label>
                <Input
                  id='product'
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder='publication_id de producto'
                />
              </div>
              {error ? (
                <p className='text-sm text-destructive' role='alert'>
                  {error}
                </p>
              ) : null}
              <Button type='submit' disabled={pending}>
                {pending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Crear borrador
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>Mis protocolos ({ownProtocols.length})</h2>
        {ownProtocols.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Todavía no creaste protocolos.</p>
        ) : (
          <div className='grid gap-4'>
            {ownProtocols.map((p) => (
              <ProtocolCard key={p.id} protocol={p} />
            ))}
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>Biblioteca comunitaria ({libraryProtocols.length})</h2>
        {libraryProtocols.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No hay protocolos publicados en la biblioteca todavía.
          </p>
        ) : (
          <div className='grid gap-4'>
            {libraryProtocols.map((p) => (
              <ProtocolCard key={p.id} protocol={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
