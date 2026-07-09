'use client'

import type { ThoughtDisplayType } from '@/lib/session/view-models'
import type { SearchMode, SearchResult } from '@/lib/session/search-utils'

const ALL_TYPES: ThoughtDisplayType[] = [
  'reasoning',
  'decision_frame',
  'action_report',
  'belief_snapshot',
  'assumption_update',
  'context_snapshot',
  'progress',
  'finding',
  'synthesis',
  'question',
  'conclusion',
]

type ViewMode = 'full' | 'decisions'

type Props = {
  isLive?: boolean
  sessionStatus: 'active' | 'completed' | 'abandoned'
  search: string
  onSearchChange: (value: string) => void
  searchResult: SearchResult | null
  searchMode: SearchMode
  onSearchModeChange: (mode: SearchMode) => void
  activeTypeFilters: Set<ThoughtDisplayType>
  onTypeFilterToggle: (type: ThoughtDisplayType) => void
  onTypeFilterClear: () => void
  typeCounts: Record<ThoughtDisplayType, number>
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  runIds: string[]
  selectedRunId: string | null
  onRunSelect: (runId: string | null) => void
  exportSlot?: React.ReactNode
}

export function SessionTraceToolbar({
  isLive,
  sessionStatus,
  search,
  onSearchChange,
  searchResult,
  searchMode,
  onSearchModeChange,
  activeTypeFilters,
  onTypeFilterToggle,
  onTypeFilterClear,
  typeCounts,
  viewMode,
  onViewModeChange,
  runIds,
  selectedRunId,
  onRunSelect,
  exportSlot,
}: Props) {
  const showLiveIndicator = sessionStatus === 'active'
  const hasAnyNonReasoning = ALL_TYPES.some(
    (t) => t !== 'reasoning' && typeCounts[t] > 0,
  )

  return (
    <div className="sticky top-0 z-20 border-b-4 border-foreground bg-background/95 backdrop-blur shadow-brutal-sm">
      {/* Row 1: Search + toggles + live indicator */}
      <div className="p-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH THOUGHTS…"
          className="h-10 w-full max-w-xs border-2 border-foreground bg-background px-4 font-mono-terminal text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/20"
        />

        {/* Search mode toggle */}
        <div role="group" aria-label="Search mode" className="flex border-2 border-foreground bg-background">
          <button
            type="button"
            aria-pressed={searchMode === 'content'}
            onClick={() => onSearchModeChange('content')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:bg-foreground focus-visible:text-background ${
              searchMode === 'content'
                ? 'bg-foreground text-background shadow-brutal-sm'
                : 'text-foreground hover:bg-foreground/10'
            }`}
          >
            Content
          </button>
          <div className="w-[2px] bg-foreground"></div>
          <button
            type="button"
            aria-pressed={searchMode === 'titles'}
            onClick={() => onSearchModeChange('titles')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:bg-foreground focus-visible:text-background ${
              searchMode === 'titles'
                ? 'bg-foreground text-background shadow-brutal-sm'
                : 'text-foreground hover:bg-foreground/10'
            }`}
          >
            Titles
          </button>
        </div>

        {/* View mode toggle */}
        <div role="group" aria-label="View mode" className="flex border-2 border-foreground bg-background">
          <button
            type="button"
            aria-pressed={viewMode === 'full'}
            onClick={() => onViewModeChange('full')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:bg-foreground focus-visible:text-background ${
              viewMode === 'full'
                ? 'bg-foreground text-background shadow-brutal-sm'
                : 'text-foreground hover:bg-foreground/10'
            }`}
          >
            Full Trace
          </button>
          <div className="w-[2px] bg-foreground"></div>
          <button
            type="button"
            aria-pressed={viewMode === 'decisions'}
            onClick={() => onViewModeChange('decisions')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:bg-foreground focus-visible:text-background ${
              viewMode === 'decisions'
                ? 'bg-foreground text-background shadow-brutal-sm'
                : 'text-foreground hover:bg-foreground/10'
            }`}
          >
            Decisions
          </button>
        </div>

        {/* Run selector */}
        {runIds.length > 1 && (
          <select
            value={selectedRunId || ''}
            onChange={(e) => onRunSelect(e.target.value || null)}
            className="h-10 border-2 border-foreground bg-background px-2 font-mono-terminal text-[10px] uppercase tracking-widest focus:outline-none"
          >
            <option value="">ALL RUNS</option>
            {runIds.map((id) => (
              <option key={id} value={id}>
                RUN {id.slice(0, 8)}
              </option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {exportSlot}

        {showLiveIndicator && isLive != null && (
          <div
            className={`flex items-center gap-3 px-4 py-2 border-2 ${
              isLive
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-foreground/30 bg-background'
            }`}
          >
            <div
              className={`w-3 h-3 ${
                isLive ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' : 'bg-foreground/30'
              }`}
            />
            <span
              className={`font-mono-terminal text-[10px] font-black uppercase tracking-widest ${
                isLive ? 'text-emerald-500' : 'text-foreground/50'
              }`}
            >
              {isLive ? 'SYS:LIVE' : 'SYS:CONNECTING'}
            </span>
          </div>
        )}
      </div>

      {/* Match count */}
      {searchResult && (
        <div className="px-4 pb-4 -mt-2" aria-live="polite">
          <span className="font-mono-terminal text-[10px] uppercase tracking-widest text-foreground/60 bg-foreground/5 px-2 py-1 border border-foreground/20">
            {searchResult.totalMatchCount === 0
              ? '0 MATCHES'
              : `${searchResult.totalMatchCount} MATCH${searchResult.totalMatchCount === 1 ? '' : 'ES'} IN ${searchResult.matchingThoughtCount} THOUGHT${searchResult.matchingThoughtCount === 1 ? '' : 'S'}`}
          </span>
        </div>
      )}

      {/* Row 2: Type filter chips */}
      {hasAnyNonReasoning && (
        <div className="px-4 pb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTypeFilterClear}
            className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 ${
              activeTypeFilters.size === 0
                ? 'border-2 border-foreground bg-foreground text-background shadow-brutal-sm'
                : 'border-2 border-foreground/30 bg-background text-foreground/60 hover:border-foreground hover:text-foreground'
            }`}
          >
            ALL
          </button>
          {ALL_TYPES.map((type) => {
            const count = typeCounts[type]
            const isActive = activeTypeFilters.has(type)
            const isDisabled = count === 0

            return (
              <button
                key={type}
                type="button"
                disabled={isDisabled}
                onClick={() => onTypeFilterToggle(type)}
                className={`px-3 py-1 font-black text-[10px] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 flex items-center gap-2 ${
                  isActive
                    ? 'border-2 border-foreground bg-foreground text-background shadow-brutal-sm'
                    : isDisabled
                      ? 'border-2 border-foreground/10 bg-background text-foreground/20 cursor-not-allowed'
                      : 'border-2 border-foreground/30 bg-background text-foreground/60 hover:border-foreground hover:text-foreground'
                }`}
              >
                {type.replace('_', ' ')}
                <span className={`font-mono-terminal opacity-70 ${isActive ? 'text-background' : 'text-foreground'}`}>[{count}]</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  function handleTypeFilterClear() {
    onTypeFilterClear()
  }
}
