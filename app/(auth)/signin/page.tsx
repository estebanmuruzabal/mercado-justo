import Link from 'next/link'
import { SignInForm } from '@/components/features/auth/sign-in-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeCheckoutCallbackUrl } from '@/lib/auth/checkout'
import { FORGOT_PASSWORD_PATH } from '@/lib/routes'

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const callbackUrl = normalizeCheckoutCallbackUrl(resolvedSearchParams?.callbackUrl)

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInForm callbackUrl={callbackUrl} redirectFallback={callbackUrl} />
          <p className="text-center text-sm">
            <Link href={FORGOT_PASSWORD_PATH} className="text-muted-foreground hover:text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}