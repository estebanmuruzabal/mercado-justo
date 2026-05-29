'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { registerUser } from '@/server/actions/auth'
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

const formSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    fullName: z.string().min(1, 'Ingresá tu nombre'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof formSchema>

export function SignUpForm({
  callbackUrl,
  redirectFallback = '/',
  onSuccess,
  compact = false,
}: {
  callbackUrl?: string
  /** Where to land when callbackUrl is missing (checkout uses /checkout). */
  redirectFallback?: string
  onSuccess?: () => void
  compact?: boolean
}) {
  const { toast } = useToast()
  const { completeAuth } = useAuthNavigation()
  const redirectTo = getPostAuthRedirectPath(callbackUrl, redirectFallback)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  })

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        callbackUrl: redirectTo,
      })

      const outcome = await completeAuth(result)
      if (outcome.error) {
        toast({
          title: 'No pudimos crear tu cuenta',
          description: outcome.error,
          variant: 'destructive',
        })
        return
      }

      if (outcome.needsEmailConfirmation) {
        toast({
          title: 'Revisá tu email',
          description: outcome.message,
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
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder='Tu nombre' autoComplete='name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                <PasswordInput placeholder='••••••••' autoComplete='new-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <PasswordInput placeholder='••••••••' autoComplete='new-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Creando tu cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </Form>
  )
}
