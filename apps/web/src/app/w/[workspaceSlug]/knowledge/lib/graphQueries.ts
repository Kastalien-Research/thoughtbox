import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Data layer for the knowledge graph UI (SPEC-KNOWLEDGE-GRAPH-UI §3).
 * All queries are workspace-scoped; RLS provides the enforcement backstop.
 */

export type Client = SupabaseClient<Database>

export type GraphEntity = {
  id: string
  name: string
  type: string
  label: string
  properties: unknown
  created_at: string
  importance_score: number
}

export type GraphRelation = {
  id: string
  from_id: string
  to_id: string
  type: string
  created_at: string
}

export type WorkspaceGraph = {
  entities: GraphEntity[]
  relations: GraphRelation[]
}

export async function loadWorkspaceGraph(
  supabase: Client,
  workspaceId: string,
  opts?: { maxNodes?: number },
): Promise<WorkspaceGraph> {
  const maxNodes = opts?.maxNodes ?? 200

  const { data: entities, error: eErr } = await supabase
    .from('entities')
    .select('id, name, type, label, properties, created_at, importance_score')
    .eq('workspace_id', workspaceId)
    .order('importance_score', { ascending: false })
    .limit(maxNodes)
  if (eErr) throw eErr

  const ids = (entities ?? []).map((e) => e.id)
  if (ids.length === 0) return { entities: [], relations: [] }

  // Edges follow nodes: only relations whose both endpoints are loaded.
  const { data: relations, error: rErr } = await supabase
    .from('relations')
    .select('id, from_id, to_id, type, created_at')
    .eq('workspace_id', workspaceId)
    .in('from_id', ids)
    .in('to_id', ids)
  if (rErr) throw rErr

  return { entities: entities ?? [], relations: relations ?? [] }
}

export type EntityObservation = {
  id: string
  content: string
  added_at: string
  added_by: string | null
  source_session: string | null
}

export type EntityRelationSummary = {
  id: string
  type: string
  entityId: string
  entityLabel: string
  direction: 'in' | 'out'
}

export type EntityDetail = {
  entity: GraphEntity | null
  observations: EntityObservation[]
  relations: EntityRelationSummary[]
}

/** Lazy per-entity detail: observations plus in/out relations (§5). */
export async function loadEntityDetail(
  supabase: Client,
  entityId: string,
): Promise<EntityDetail> {
  const [entityRes, observationsRes, outRes, inRes] = await Promise.all([
    supabase
      .from('entities')
      .select('id, name, type, label, properties, created_at, importance_score')
      .eq('id', entityId)
      .single(),
    supabase
      .from('observations')
      .select('id, content, added_at, added_by, source_session')
      .eq('entity_id', entityId)
      .order('added_at', { ascending: false })
      .limit(50),
    supabase
      .from('relations')
      .select('id, type, to_id')
      .eq('from_id', entityId),
    supabase
      .from('relations')
      .select('id, type, from_id')
      .eq('to_id', entityId),
  ])

  const out = outRes.data ?? []
  const inn = inRes.data ?? []

  // Resolve neighbor labels in one query.
  const neighborIds = [
    ...new Set([...out.map((r) => r.to_id), ...inn.map((r) => r.from_id)]),
  ]
  let labels = new Map<string, string>()
  if (neighborIds.length > 0) {
    const { data: neighbors } = await supabase
      .from('entities')
      .select('id, label, name')
      .in('id', neighborIds)
    labels = new Map(
      (neighbors ?? []).map((n) => [n.id, n.label || n.name]),
    )
  }

  const relations: EntityRelationSummary[] = [
    ...out.map((r) => ({
      id: r.id,
      type: r.type,
      entityId: r.to_id,
      entityLabel: labels.get(r.to_id) ?? r.to_id,
      direction: 'out' as const,
    })),
    ...inn.map((r) => ({
      id: r.id,
      type: r.type,
      entityId: r.from_id,
      entityLabel: labels.get(r.from_id) ?? r.from_id,
      direction: 'in' as const,
    })),
  ]

  return {
    entity: entityRes.data ?? null,
    observations: observationsRes.data ?? [],
    relations,
  }
}
