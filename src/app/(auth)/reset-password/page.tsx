import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '@/domains/auth/presentation/components/reset-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { createClient } from '@/shared/database/supabase/server'
import { FORGOT_PASSWORD_PATH } from '@/shared/routing/routes'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(FORGOT_PASSWORD_PATH)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nueva contraseña</CardTitle>
          <CardDescription>Elegí una contraseña segura para tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
