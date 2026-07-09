import type { ElementDefinition } from 'cytoscape'
import type { GraphEntity, GraphRelation } from './graphQueries'

/**
 * SPEC-KNOWLEDGE-GRAPH-UI §3.2 + §12.10: DB rows → Cytoscape elements.
 * Type goes on `data` (attribute selectors, not classes), and orphan
 * detection marks entities with no incoming provenance relation.
 */

/** Relation types that count as provenance for orphan detection. */
export const PROVENANCE_RELATION_TYPES = new Set([
  'EXTRACTED_FROM',
  'BUILDS_ON',
  'LEARNED_BY',
])

export const ENTITY_TYPES = [
  'Insight',
  'Concept',
  'Workflow',
  'Decision',
  'Agent',
] as const

export const RELATION_TYPES = [
  'RELATES_TO',
  'BUILDS_ON',
  'CONTRADICTS',
  'EXTRACTED_FROM',
  'APPLIED_IN',
  'LEARNED_BY',
  'DEPENDS_ON',
  'SUPERSEDES',
  'MERGED_FROM',
] as const

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** Entity ids that have at least one incoming provenance relation. */
export function provenancedEntityIds(relations: GraphRelation[]): Set<string> {
  const ids = new Set<string>()
  for (const r of relations) {
    if (PROVENANCE_RELATION_TYPES.has(r.type)) ids.add(r.to_id)
  }
  return ids
}

export function toCytoscapeElements({
  entities,
  relations,
}: {
  entities: GraphEntity[]
  relations: GraphRelation[]
}): ElementDefinition[] {
  const loadedIds = new Set(entities.map((e) => e.id))
  const provenanced = provenancedEntityIds(relations)

  const nodes: ElementDefinition[] = entities.map((e) => ({
    data: {
      id: e.id,
      label: e.label || e.name,
      name: e.name,
      type: e.type,
      importance: clamp01(e.importance_score),
      isOrphan: provenanced.has(e.id) ? 'false' : 'true',
    },
  }))

  const edges: ElementDefinition[] = relations
    .filter((r) => loadedIds.has(r.from_id) && loadedIds.has(r.to_id))
    .map((r) => ({
      data: {
        id: r.id,
        source: r.from_id,
        target: r.to_id,
        type: r.type,
      },
    }))

  return [...nodes, ...edges]
}
