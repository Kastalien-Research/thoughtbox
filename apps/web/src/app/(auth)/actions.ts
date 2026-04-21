'use server'

import { getSiteUrl } from '@/lib/thoughtbox-config'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthFormState =
  | { error: string; success?: never }
  | { success: true; error?: never }
  | null

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
    return { error: authError.message }
  }

  if (!user) return { error: 'Authentication failed' }

  // Resolve user's default workspace slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('default_workspace_id, workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile?.workspaces) {
    console.error('Failed to resolve workspace for user:', profileError)
    // Fallback to a generic app home if workspace lookup fails
    redirect('/app')
  }

  const workspaceSlug = (profile.workspaces as unknown as { slug: string }).slug
  redirect(`/w/${workspaceSlug}/dashboard`)
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const inviteCode = (formData.get('inviteCode') as string | null)?.trim() ?? ''
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = (formData.get('firstName') as string | null)?.trim() ?? ''
  const lastName = (formData.get('lastName') as string | null)?.trim() ?? ''

  const validCodes = new Set([
    'DEDALUS25',
  ])

  if (!validCodes.has(inviteCode.toUpperCase())) {
    return { error: 'Invalid invite code.' }
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters.' }
  }

  const siteUrl = getSiteUrl()

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string

  const siteUrl = getSiteUrl()

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.updateUser({ password })

  if (authError) {
    return { error: authError.message }
  }

  if (!user) return { error: 'Authentication failed' }

  // Resolve user's default workspace slug
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single()

  const workspaceSlug = (profile?.workspaces as unknown as { slug: string } | null)?.slug
  if (!workspaceSlug) {
    redirect('/sign-in')
  }
  redirect(`/w/${workspaceSlug}/dashboard`)
}
