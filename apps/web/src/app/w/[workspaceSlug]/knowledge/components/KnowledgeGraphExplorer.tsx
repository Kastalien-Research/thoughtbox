'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GraphEntity, GraphRelation } from '../lib/graphQueries'
import {
  toCytoscapeElements,
  provenancedEntityIds,
  ENTITY_TYPES,
  RELATION_TYPES,
} from '../lib/toCytoscapeElements'
import { GraphFilters } from './GraphFilters'
import { EntityDetailPanel } from './EntityDetailPanel'

// Cytoscape renders to canvas — client-only (react-cytoscapejs #117 caveat).
const KnowledgeGraph = dynamic(() => import('./KnowledgeGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-foreground/50">
      Loading graph…
    </div>
  ),
})

type Props = {
  entities: GraphEntity[]
  relations: GraphRelation[]
  workspaceSlug: string
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return counts
}

/** Union of the spec'd canonical types and whatever is actually in the data. */
function unionTypes(canonical: readonly string[], present: Iterable<string>): string[] {
  const extra = [...new Set(present)].filter((t) => !canonical.includes(t)).sort()
  return [...canonical, ...extra]
}

export function KnowledgeGraphExplorer({ entities, relations, workspaceSlug }: Props) {
  const entityTypes = useMemo(
    () => unionTypes(ENTITY_TYPES, entities.map((e) => e.type)),
    [entities],
  )
  const relationTypes = useMemo(
    () => unionTypes(RELATION_TYPES, relations.map((r) => r.type)),
    [relations],
  )

  const [search, setSearch] = useState('')
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<string>>(
    () => new Set(entityTypes),
  )
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<Set<string>>(
    () => new Set(relationTypes),
  )
  const [orphanOnly, setOrphanOnly] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  const toggleIn = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const { visibleEntities, visibleRelations } = useMemo(() => {
    // 1. Entity-type filter
    let nodes = entities.filter((e) => selectedEntityTypes.has(e.type))

    // 2. Orphan-only diagnostic (computed against the full loaded relation set)
    if (orphanOnly) {
      const provenanced = provenancedEntityIds(relations)
      nodes = nodes.filter((e) => !provenanced.has(e.id))
    }

    // 3. Focus mode: matches + 1-hop neighborhood (§12.5)
    const q = search.trim().toLowerCase()
    if (q.length > 0) {
      const matched = new Set(
        nodes
          .filter(
            (e) =>
              e.label.toLowerCase().includes(q) || e.name.toLowerCase().includes(q),
          )
          .map((e) => e.id),
      )
      const nodeIds = new Set(nodes.map((n) => n.id))
      const neighborhood = new Set(matched)
      for (const r of relations) {
        if (matched.has(r.from_id) && nodeIds.has(r.to_id)) neighborhood.add(r.to_id)
        if (matched.has(r.to_id) && nodeIds.has(r.from_id)) neighborhood.add(r.from_id)
      }
      nodes = nodes.filter((e) => neighborhood.has(e.id))
    }

    // 4. Relation-type filter + edges follow visible nodes
    const visibleIds = new Set(nodes.map((n) => n.id))
    const edges = relations.filter(
      (r) =>
        selectedRelationTypes.has(r.type) &&
        visibleIds.has(r.from_id) &&
        visibleIds.has(r.to_id),
    )

    return { visibleEntities: nodes, visibleRelations: edges }
  }, [entities, relations, search, selectedEntityTypes, selectedRelationTypes, orphanOnly])

  const elements = useMemo(
    () =>
      toCytoscapeElements({
        entities: visibleEntities,
        relations: visibleRelations,
      }),
    [visibleEntities, visibleRelations],
  )

  // Relayout only when the node set materially changes (§7), not on selection.
  const layoutKey = useMemo(
    () =>
      `${visibleEntities.length}:${visibleRelations.length}:${visibleEntities
        .map((e) => e.id)
        .sort()
        .join(',')
        .slice(0, 512)}`,
    [visibleEntities, visibleRelations],
  )

  const handleNodeSelect = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId)
  }, [])

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr_320px] min-h-[600px]">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 overflow-y-auto">
        <GraphFilters
          search={search}
          onSearchChange={setSearch}
          entityTypes={entityTypes}
          entityTypeCounts={countBy(entities.map((e) => e.type))}
          selectedEntityTypes={selectedEntityTypes}
          onToggleEntityType={(t) =>
            setSelectedEntityTypes((prev) => toggleIn(prev, t))
          }
          relationTypes={relationTypes}
          relationTypeCounts={countBy(relations.map((r) => r.type))}
          selectedRelationTypes={selectedRelationTypes}
          onToggleRelationType={(t) =>
            setSelectedRelationTypes((prev) => toggleIn(prev, t))
          }
          orphanOnly={orphanOnly}
          onOrphanOnlyChange={setOrphanOnly}
          visibleNodeCount={visibleEntities.length}
          visibleEdgeCount={visibleRelations.length}
        />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] h-[600px] xl:h-auto overflow-hidden">
        {elements.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground/50 px-6 text-center">
            No entities match the current filters.
          </div>
        ) : (
          <KnowledgeGraph
            elements={elements}
            layoutKey={layoutKey}
            selectedEntityId={selectedEntityId}
            onNodeSelect={handleNodeSelect}
          />
        )}
      </div>

      <div className="h-[600px] xl:h-auto">
        {selectedEntityId ? (
          <EntityDetailPanel
            entityId={selectedEntityId}
            workspaceSlug={workspaceSlug}
            onSelectEntity={setSelectedEntityId}
            onClose={() => setSelectedEntityId(null)}
          />
        ) : (
          <div className="h-full rounded-2xl border border-dashed border-foreground/10 flex items-center justify-center px-6">
            <p className="text-sm text-foreground/40 text-center">
              Select an entity to see its observations and relations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
