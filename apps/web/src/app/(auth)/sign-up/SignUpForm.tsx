'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpAction, type AuthFormState } from '../actions'

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    null,
  )

  if (state?.success) {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-6 py-5 text-center">
        <p className="text-sm font-medium text-green-800">Check your email!</p>
        <p className="mt-1 text-xs text-green-700">
          We sent a confirmation link to your inbox. Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" aria-label="Sign up form">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Ada"
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Lovelace"
            className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground">
          Invite code
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          type="text"
          required
          placeholder="Enter your invite code"
          autoComplete="off"
          className="mt-1.5 block w-full rounded-none border border-foreground bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-slate-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 font-mono tracking-wider"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ada@example.com"
          className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Min. 12 characters"
          className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-semibold transition-all hover:bg-foreground/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-foreground">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="text-foreground hover:underline-thick hover:underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-foreground hover:underline-thick hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}
