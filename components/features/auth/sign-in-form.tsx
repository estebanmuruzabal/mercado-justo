'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signIn } from '@/server/actions/auth'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getPostAuthRedirectPath } from '@/lib/auth/callback-url'
import { useAuthNavigation } from '@/hooks/auth/use-auth-navigation'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type FormData = z.infer<typeof formSchema>

export function SignInForm({
  callbackUrl,
  redirectFallback = '/',
  onSuccess,
  compact = false,
}: {
  callbackUrl?: string
  redirectFallback?: string
  onSuccess?: () => void
  compact?: boolean
}) {
  const { toast } = useToast()
  const { completeAuth } = useAuthNavigation()
  const redirectTo = getPostAuthRedirectPath(callbackUrl, redirectFallback)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDev = process.env.NODE_ENV === 'development'
  const devEmail = 'admin@admin.com'
  const devPassword = '123456'

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: isDev ? devEmail : '',
      password: isDev ? devPassword : '',
    },
  })

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      const result = await signIn({
        ...data,
        callbackUrl: redirectTo,
      })

      const outcome = await completeAuth(result)
      if (outcome.error) {
        toast({
          title: 'Error',
          description: outcome.error,
          variant: 'destructive',
        })
        return
      }

      if (outcome.ok) {
        onSuccess?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={compact ? 'space-y-3' : 'space-y-4'}>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='vos@email.com' autoComplete='email' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput placeholder='••••••••' autoComplete='current-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </Form>
  )
}
