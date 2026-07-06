import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggregateBranches, type RepoSession } from '@/lib/repo/timeline'
import { RepoGraphView } from './RepoGraphView'

export const metadata: Metadata = { title: 'Reasoning Repo' }

const SESSION_LIMIT = 25

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function RepoPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()
  if (!workspace) notFound()

  const { data: sessionRows } = await supabase
    .from('sessions')
    .select('id, title, status, created_at, thought_count')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(SESSION_LIMIT)

  const sessions: RepoSession[] = (sessionRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    thoughtCount: row.thought_count,
  }))

  // Branch structure for the loaded sessions (branch thoughts only).
  const sessionIds = sessions.map((s) => s.id)
  const { data: branchRows } =
    sessionIds.length > 0
      ? await supabase
          .from('thoughts')
          .select('session_id, branch_id, agent_id')
          .eq('workspace_id', workspace.id)
          .in('session_id', sessionIds)
          .not('branch_id', 'is', null)
      : { data: [] }

  const branches = aggregateBranches(branchRows ?? [])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Reasoning Repo</h1>
        <p className="mt-1 text-sm text-foreground/60">
          The workspace as a growing graph — reasoning sessions on the main
          line, agent branches forking off, merge commits joining work back
          together. Read-only.
        </p>
      </div>

      <RepoGraphView
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        sessions={sessions}
        branches={branches}
      />
    </div>
  )
}
