import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  createPeersReadClient,
  type PeerInvocationRow,
  type PeerManifestRow,
  type PeerNotebookRow,
} from './db'

export const metadata: Metadata = { title: 'Peers' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function PeersPage({ params }: Props) {
  const { workspaceSlug } = await params

  const supabase = await createPeersReadClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, slug')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const [peersResult, manifestsResult, invocationsResult] = await Promise.all([
    supabase
      .from('peer_notebooks')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('peer_manifests')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('peer_invocations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const peers: PeerNotebookRow[] = peersResult.data ?? []
  // manifest/error are `Json` in the generated types; narrow to the
  // structured views the page renders (see ./db.ts).
  const manifests = (manifestsResult.data ?? []) as PeerManifestRow[]
  const invocations = (invocationsResult.data ?? []) as PeerInvocationRow[]

  const peerSlugById = new Map(peers.map(peer => [peer.id, peer.slug]))
  const manifestsByPeer = new Map<string, PeerManifestRow[]>()
  for (const manifest of manifests) {
    const list = manifestsByPeer.get(manifest.peer_id) ?? []
    list.push(manifest)
    manifestsByPeer.set(manifest.peer_id, list)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Peers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brokered peer notebooks — manifests through the draft-to-active lifecycle, and their invocations.
        </p>
      </div>

      {peers.length === 0 ? (
        <Panel title="Peers">
          <p className="py-6 text-center text-sm text-muted-foreground">
            No peers registered in this workspace yet.
          </p>
        </Panel>
      ) : (
        <div className="space-y-6">
          {peers.map(peer => {
            const peerManifests = manifestsByPeer.get(peer.id) ?? []
            return (
              <Panel
                key={peer.id}
                title={peer.display_name}
                subtitle={`${peer.slug} · ${peerManifests.length} manifest${peerManifests.length === 1 ? '' : 's'}`}
              >
                {peer.description && (
                  <p className="mb-3 text-xs text-muted-foreground">{peer.description}</p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-foreground/10 text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Version</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Runtime entry</th>
                        <th className="py-2 pr-4 font-medium">Tools</th>
                        <th className="py-2 pr-4 font-medium">Hash</th>
                        <th className="py-2 font-medium">Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peerManifests.map(manifest => (
                        <tr key={manifest.id} className="border-b border-foreground/5">
                          <td className="py-2 pr-4 tabular-nums text-foreground">v{manifest.version}</td>
                          <td className="py-2 pr-4">
                            <StatusBadge status={manifest.status} active={manifest.id === peer.active_manifest_id} />
                          </td>
                          <td className="py-2 pr-4 font-mono text-foreground">
                            {manifest.manifest?.runtime?.entry ?? '—'}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {(manifest.manifest?.exposes?.tools ?? [])
                              .map(tool => tool.name)
                              .filter(Boolean)
                              .join(', ') || '—'}
                          </td>
                          <td className="py-2 pr-4 font-mono text-muted-foreground" title={manifest.manifest_hash}>
                            {shortHash(manifest.manifest_hash)}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {manifest.approved_at ? formatTimestamp(manifest.approved_at) : '—'}
                          </td>
                        </tr>
                      ))}
                      {peerManifests.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-muted-foreground">
                            No manifests recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <Panel title="Recent invocations" subtitle="Last 50">
        {invocations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No peer invocations recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-foreground/10 text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Peer</th>
                  <th className="py-2 pr-4 font-medium">Tool</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">Duration</th>
                  <th className="py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {invocations.map(invocation => (
                  <tr key={invocation.id} className="border-b border-foreground/5">
                    <td className="py-2 pr-4 text-foreground">
                      {peerSlugById.get(invocation.peer_id) ?? shortHash(invocation.peer_id)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-foreground">{invocation.tool_name}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={invocation.status} />
                      {invocation.error?.message && (
                        <span className="ml-2 text-muted-foreground" title={invocation.error.message}>
                          {truncate(invocation.error.message, 60)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{invocation.runtime_provider}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                      {invocation.duration_ms === null ? '—' : `${invocation.duration_ms} ms`}
                    </td>
                    <td className="py-2 text-muted-foreground">{formatTimestamp(invocation.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  active: 'border-emerald-600 text-emerald-600',
  completed: 'border-emerald-600 text-emerald-600',
  draft: 'border-blue-500 text-blue-500',
  running: 'border-blue-500 text-blue-500',
  queued: 'border-blue-500 text-blue-500',
  failed: 'border-rose-500 text-rose-500',
  denied: 'border-rose-500 text-rose-500',
  timeout: 'border-rose-500 text-rose-500',
  rejected: 'border-rose-500 text-rose-500',
  cancelled: 'border-foreground/20 text-muted-foreground',
  retired: 'border-foreground/20 text-muted-foreground',
}

function StatusBadge({ status, active }: { status: string; active?: boolean }) {
  const styles = STATUS_STYLES[status] ?? 'border-foreground/20 text-muted-foreground'
  return (
    <span
      className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles}`}
    >
      {status}
      {active ? ' · live' : ''}
    </span>
  )
}

function shortHash(value: string): string {
  const hex = value.startsWith('sha256:') ? value.slice(7) : value
  return hex.slice(0, 12)
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
