import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadWorkspaceGraph } from './lib/graphQueries'
import { KnowledgeGraphExplorer } from './components/KnowledgeGraphExplorer'

export const metadata: Metadata = { title: 'Knowledge Graph' }

const DEFAULT_MAX_NODES = 200
const MAX_NODES_CAP = 1000

type Props = {
  params: Promise<{ workspaceSlug: string }>
  searchParams: Promise<{ max?: string }>
}

export default async function KnowledgePage({ params, searchParams }: Props) {
  const [{ workspaceSlug }, { max }] = await Promise.all([params, searchParams])

  const parsedMax = Number.parseInt(max ?? '', 10)
  const maxNodes = Number.isFinite(parsedMax)
    ? Math.min(Math.max(parsedMax, 1), MAX_NODES_CAP)
    : DEFAULT_MAX_NODES

  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()
  if (!workspace) notFound()

  const { entities, relations } = await loadWorkspaceGraph(supabase, workspace.id, {
    maxNodes,
  })

  const atCap = entities.length >= maxNodes && maxNodes < MAX_NODES_CAP

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Agent-authored entities, relations, and observations for this
            workspace. Read-only — mutation happens via MCP.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-foreground/60">
          <span className="font-mono tabular-nums">
            {entities.length} entities · {relations.length} relations loaded
          </span>
          {atCap && (
            <Link
              href={`/w/${workspaceSlug}/knowledge?max=${maxNodes + 100}`}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors"
            >
              Load {100} more
            </Link>
          )}
        </div>
      </div>

      {entities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 px-6 py-16 text-center">
          <p className="font-medium text-foreground">No knowledge yet</p>
          <p className="mt-1 text-sm text-foreground/60">
            Entities appear here as agents record insights, concepts,
            workflows, and decisions through the Thoughtbox MCP surface.
          </p>
        </div>
      ) : (
        <KnowledgeGraphExplorer
          entities={entities}
          relations={relations}
          workspaceSlug={workspaceSlug}
        />
      )}
    </div>
  )
}
