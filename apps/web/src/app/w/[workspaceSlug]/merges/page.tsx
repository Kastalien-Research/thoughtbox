import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MergeApprovalView } from './MergeApprovalView'

export const metadata: Metadata = { title: 'Merges' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function MergesPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createClient()
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()
  if (!workspace) notFound()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Merges</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Agents request merges and generate evidence; only you can approve.
          Blocked merges are immutable — a failed evidence notebook requires a
          new merge request.
        </p>
      </div>

      <MergeApprovalView workspaceId={workspace.id} />
    </div>
  )
}
