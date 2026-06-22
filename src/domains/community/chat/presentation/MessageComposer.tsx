'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'

export function MessageComposer({
  disabled,
  onSend,
}: {
  disabled?: boolean
  onSend: (body: string) => Promise<void>
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || sending || disabled) return

    setSending(true)
    try {
      await onSend(trimmed)
      setBody('')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className='flex items-end gap-2 border-t bg-background p-3'>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Escribir mensaje…'
        rows={2}
        disabled={disabled || sending}
        className='min-h-[44px] resize-none'
      />
      <Button
        type='button'
        size='icon'
        disabled={disabled || sending || !body.trim()}
        onClick={() => void handleSend()}
        aria-label='Enviar mensaje'
      >
        <Send className='size-4' />
      </Button>
    </div>
  )
}
