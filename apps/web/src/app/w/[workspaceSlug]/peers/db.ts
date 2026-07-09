import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'

// Read-only Supabase access for the peers page, typed against the generated
// Database type (workspace member read access is granted by the peer_* RLS
// policies in the 20260430010000_create_peer_notebook_control_plane
// migration). The manifest/error columns are `Json` in the generated types;
// the page narrows them to the structured views below at the query boundary.

type Tables = Database['public']['Tables']

export type PeerNotebookRow = Tables['peer_notebooks']['Row']

export type PeerManifestRow = Omit<Tables['peer_manifests']['Row'], 'manifest'> & {
  manifest: {
    runtime?: { provider?: string; entry?: string }
    exposes?: { tools?: Array<{ name?: string }> }
  } | null
}

export type PeerInvocationRow = Omit<Tables['peer_invocations']['Row'], 'error'> & {
  error: { message?: string } | null
}

export async function createPeersReadClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Read-only page rendered in a Server Component — session refresh
          // is handled by middleware, so cookie writes are a no-op here.
        },
      },
    },
  )
}
