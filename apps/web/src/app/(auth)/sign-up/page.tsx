import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-foreground">
            Closed founding beta — invite code required
          </p>
        </div>

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-foreground">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-foreground hover:underline-thick hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
