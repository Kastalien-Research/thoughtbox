import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SessionDetailHeader } from '@/components/session-area/session-detail-header'
import { SessionSummaryCard } from '@/components/session-area/session-summary-card'
import { SessionTraceExplorer } from '@/components/session-area/session-trace-explorer'
import {
  createSessionDetailVM,
  type RawSessionRecord,
  type RawThoughtRecord,
  type RawOtelEventRecord,
} from '@/lib/session/view-models'
import { computeSessionSummary } from '@/lib/session/compute-session-summary'
import { parseAuditManifest } from '@/lib/session/audit-manifest'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Session' }

type Props = { params: Promise<{ workspaceSlug: string, sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { workspaceSlug, sessionId } = await params

  const supabase = await createClient()
  
  // Fetch session details - ensure we get workspace_id for realtime
  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('*, workspace_id')
    .eq('id', sessionId)
    .single()
    
  if (sessionError || !sessionRow) {
    console.error('Failed to fetch session:', sessionError)
    notFound()
  }

  // Look up OTEL session IDs via the runs binding table
  const { data: runRows } = await supabase
    .from('runs')
    .select('otel_session_id')
    .eq('workspace_id', sessionRow.workspace_id)
    .eq('session_id', sessionId)
    .not('otel_session_id', 'is', null)

  const otelSessionIds = [...new Set(
    (runRows ?? []).map(r => r.otel_session_id).filter(Boolean)
  )]

  // Fetch thoughts, OTEL events, and total OTEL count in parallel
  // Increased from 500 to 10,000 to handle realistic trace sizes (covers 99%+ of use cases)
  // while maintaining reasonable performance. Can be extended with pagination if needed.
  const OTEL_PAGE_LIMIT = 10000
  const [thoughtsResult, otelResult, otelCountResult] = await Promise.all([
    supabase
      .from('thoughts')
      .select('*')
      .eq('session_id', sessionId)
      .order('thought_number', { ascending: true }),
    otelSessionIds.length > 0
      ? supabase
          .from('otel_events')
          .select('id, event_type, event_name, severity, timestamp_at, body, metric_value, event_attrs, session_id')
          .eq('workspace_id', sessionRow.workspace_id)
          .in('session_id', otelSessionIds)
          .order('timestamp_at', { ascending: true })
          .limit(OTEL_PAGE_LIMIT)
      : Promise.resolve({ data: [], error: null }),
    otelSessionIds.length > 0
      ? supabase
          .from('otel_events')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', sessionRow.workspace_id)
          .in('session_id', otelSessionIds)
      : Promise.resolve({ count: 0, error: null }),
  ])

  const totalOtelCount = otelCountResult.count ?? 0

  const { data: thoughtRows, error: thoughtsError } = thoughtsResult
  if (thoughtsError) {
    console.error('Failed to fetch thoughts:', thoughtsError)
  }

  const otelEvents: RawOtelEventRecord[] = (otelResult.data ?? []).map((row) => ({
    id: row.id,
    event_type: row.event_type,
    event_name: row.event_name,
    severity: row.severity,
    timestamp_at: row.timestamp_at,
    body: row.body,
    metric_value: row.metric_value,
    event_attrs: row.event_attrs as Record<string, unknown> | null,
    session_id: row.session_id,
  }))

  // Map Session
  const rawSession: RawSessionRecord = {
    id: sessionRow.id,
    title: sessionRow.title ?? undefined,
    tags: sessionRow.tags ?? undefined,
    createdAt: sessionRow.created_at,
    completedAt: sessionRow.completed_at ?? undefined,
    updatedAt: sessionRow.updated_at ?? undefined,
    status: (sessionRow.status || 'abandoned') as RawSessionRecord['status'],
  }
  const sessionVM = createSessionDetailVM(rawSession)
  
  // Override the thoughtCount in the VM with the denormalized DB column if available
  if (sessionRow.thought_count != null) {
    sessionVM.thoughtCount = sessionRow.thought_count
  }

  const rawThoughts: RawThoughtRecord[] = (thoughtRows || []).map(row => ({
    id: row.id,
    thoughtNumber: row.thought_number ?? undefined,
    totalThoughts: row.total_thoughts ?? undefined,
    thought: row.thought,
    timestamp: row.timestamp,
    nextThoughtNeeded: row.next_thought_needed ?? undefined,
    isRevision: row.is_revision ?? undefined,
    revisesThought: row.revises_thought ?? undefined,
    branchId: row.branch_id ?? undefined,
    branchFromThought: row.branch_from_thought ?? undefined,
    thoughtType: row.thought_type as RawThoughtRecord['thoughtType'],
    confidence: row.confidence as RawThoughtRecord['confidence'],
    options: row.options as RawThoughtRecord['options'],
    actionResult: row.action_result as RawThoughtRecord['actionResult'],
    beliefs: row.beliefs as RawThoughtRecord['beliefs'],
    assumptionChange: row.assumption_change as RawThoughtRecord['assumptionChange'],
    contextData: row.context_data as RawThoughtRecord['contextData'],
    progressData: row.progress_data as RawThoughtRecord['progressData'],
    agentId: row.agent_id ?? undefined,
    agentName: row.agent_name ?? undefined,
    contentHash: row.content_hash ?? undefined,
    parentHash: row.parent_hash ?? undefined,
    critique: row.critique ?? undefined,
  }))

  const summary = computeSessionSummary(rawThoughts, rawSession.tags || [])
  const auditManifest = parseAuditManifest(sessionRow.audit_manifest)
  const defaultExpanded = true

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 bg-background min-h-[calc(100vh-theme(spacing.16))] text-foreground">
      <SessionDetailHeader session={sessionVM} workspaceSlug={workspaceSlug} activeView="trace" />

      <SessionSummaryCard
        {...summary}
        durationLabel={sessionVM.durationLabel}
        defaultExpanded={defaultExpanded}
        auditManifest={auditManifest}
      />

      <SessionTraceExplorer
        initialThoughts={rawThoughts}
        initialOtelEvents={otelEvents}
        otelTotalCount={totalOtelCount}
        workspaceId={sessionRow.workspace_id}
        sessionId={sessionId}
        sessionStatus={sessionVM.status}
        sessionVM={sessionVM}
      />
    </div>
  )
}
