'use client'

/**
 * Filter column for the knowledge graph (SPEC-KNOWLEDGE-GRAPH-UI §12.7).
 * Client-side filtering of the loaded snapshot: text search (focus mode),
 * entity-type / relation-type checkboxes, orphan-only diagnostic toggle.
 */

type CheckboxGroupProps = {
  title: string
  options: string[]
  counts: Map<string, number>
  selected: Set<string>
  onToggle: (value: string) => void
}

function CheckboxGroup({ title, options, counts, selected, onToggle }: CheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">
        {title}
      </legend>
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer hover:text-foreground"
          >
            <input
              type="checkbox"
              checked={selected.has(option)}
              onChange={() => onToggle(option)}
              className="h-3.5 w-3.5 rounded border-foreground/30 accent-foreground"
            />
            <span className="flex-1">{option}</span>
            <span className="text-xs font-mono text-foreground/40 tabular-nums">
              {counts.get(option) ?? 0}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

type Props = {
  search: string
  onSearchChange: (value: string) => void
  entityTypes: string[]
  entityTypeCounts: Map<string, number>
  selectedEntityTypes: Set<string>
  onToggleEntityType: (type: string) => void
  relationTypes: string[]
  relationTypeCounts: Map<string, number>
  selectedRelationTypes: Set<string>
  onToggleRelationType: (type: string) => void
  orphanOnly: boolean
  onOrphanOnlyChange: (value: boolean) => void
  visibleNodeCount: number
  visibleEdgeCount: number
}

export function GraphFilters({
  search,
  onSearchChange,
  entityTypes,
  entityTypeCounts,
  selectedEntityTypes,
  onToggleEntityType,
  relationTypes,
  relationTypeCounts,
  selectedRelationTypes,
  onToggleRelationType,
  orphanOnly,
  onOrphanOnlyChange,
  visibleNodeCount,
  visibleEdgeCount,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="kg-search"
          className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block"
        >
          Search
        </label>
        <input
          id="kg-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Focus on entities…"
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/30"
        />
        {search.trim().length > 0 && (
          <p className="mt-1.5 text-[11px] text-foreground/50">
            Focus mode: matches plus 1-hop neighborhood.
          </p>
        )}
      </div>

      <CheckboxGroup
        title="Entity Types"
        options={entityTypes}
        counts={entityTypeCounts}
        selected={selectedEntityTypes}
        onToggle={onToggleEntityType}
      />

      <CheckboxGroup
        title="Relation Types"
        options={relationTypes}
        counts={relationTypeCounts}
        selected={selectedRelationTypes}
        onToggle={onToggleRelationType}
      />

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">
          Diagnostics
        </legend>
        <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer hover:text-foreground">
          <input
            type="checkbox"
            checked={orphanOnly}
            onChange={(e) => onOrphanOnlyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-foreground/30 accent-foreground"
          />
          <span>Orphans only</span>
        </label>
        <p className="mt-1 text-[11px] text-foreground/50">
          Entities with no incoming provenance relation
          (EXTRACTED_FROM, BUILDS_ON, LEARNED_BY).
        </p>
      </fieldset>

      <div className="border-t border-foreground/10 pt-3 text-xs text-foreground/50 font-mono tabular-nums">
        {visibleNodeCount} entities · {visibleEdgeCount} relations shown
      </div>
    </div>
  )
}
