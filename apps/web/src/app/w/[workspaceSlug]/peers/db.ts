import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read-only Supabase access for the peers page. The peer control-plane
// tables are not yet in the generated lib/supabase/database.types.ts, so this
// route ships its own minimal typed view of the rows it reads (workspace
// member read access is granted by the peer_* RLS policies in the
// 20260430010000_create_peer_notebook_control_plane migration).

export type PeerNotebookRow = {
  id: string
  workspace_id: string
  slug: string
  display_name: string
  description: string | null
  status: string
  active_manifest_id: string | null
  created_at: string
  updated_at: string
}

export type PeerManifestRow = {
  id: string
  workspace_id: string
  peer_id: string
  version: number
  schema_version: string
  manifest: {
    runtime?: { provider?: string; entry?: string }
    exposes?: { tools?: Array<{ name?: string }> }
  } | null
  manifest_hash: string
  status: string
  approved_at: string | null
  created_at: string
}

export type PeerInvocationRow = {
  id: string
  workspace_id: string
  peer_id: string
  manifest_hash: string
  tool_name: string
  status: string
  runtime_provider: string
  duration_ms: number | null
  error: { message?: string } | null
  created_at: string
}

type TableOf<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

type PeersDatabase = {
  public: {
    Tables: {
      workspaces: TableOf<{ id: string; slug: string }>
      peer_notebooks: TableOf<PeerNotebookRow>
      peer_manifests: TableOf<PeerManifestRow>
      peer_invocations: TableOf<PeerInvocationRow>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export async function createPeersReadClient() {
  const cookieStore = await cookies()

  return createServerClient<PeersDatabase>(
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
