'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'

import { requestPasswordReset } from '@/server/actions/auth-recovery'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { SIGN_IN_PATH } from '@/lib/routes'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof formSchema>

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      const result = await requestPasswordReset(data.email)

      if ('error' in result) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      setSent(true)
      toast({
        title: 'Revisá tu email',
        description: result.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center text-sm text-muted-foreground">
        <p>
          Si existe una cuenta con ese email, te enviamos un enlace para restablecer la contraseña.
        </p>
        <Link href={SIGN_IN_PATH} className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="vos@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href={SIGN_IN_PATH} className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </Form>
  )
}
