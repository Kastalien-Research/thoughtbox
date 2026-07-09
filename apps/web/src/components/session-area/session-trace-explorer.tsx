'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type {
  RawThoughtRecord,
  RawOtelEventRecord,
  ThoughtDisplayType,
  SessionDetailVM,
  OtelEventVM,
} from '@/lib/session/view-models'
import {
  createOtelEventVMs,
  mergeTimeline,
} from '@/lib/session/view-models'
import { useSessionRealtime } from '@/lib/session/use-session-realtime'
import {
  computeSearchResults,
  type SearchMode,
  type SearchResult,
} from '@/lib/session/search-utils'
import { groupByDecisions } from '@/lib/session/decision-grouping'
import { detectPhases } from '@/lib/session/phase-detection'
import { SessionTraceToolbar } from './session-trace-toolbar'
import { SessionTimeline } from './session-timeline'
import { DecisionTimeline } from './decision-timeline'
import { ThoughtDetailPanel } from './thought-detail-panel'
import { ExportDropdown } from './export-dropdown'
import { SessionIdDiagnostic } from './session-id-diagnostic'

type ViewMode = 'full' | 'decisions'

type Props = {
  initialThoughts: RawThoughtRecord[]
  initialOtelEvents: RawOtelEventRecord[]
  otelTotalCount: number
  workspaceId: string
  sessionId: string
  sessionStatus: 'active' | 'completed' | 'abandoned'
  sessionVM: SessionDetailVM
}

export function SessionTraceExplorer({
  initialThoughts,
  initialOtelEvents,
  otelTotalCount,
  workspaceId,
  sessionId,
  sessionStatus,
  sessionVM,
}: Props) {
  const { rows, details, isLive } = useSessionRealtime(
    initialThoughts,
    workspaceId,
    sessionId,
  )

  // OTEL events are already scoped to this session via otel_session_id in the DB query.
  // No client-side time-window filter is needed — such a filter would incorrectly drop events
  // whose timestamps (from the MCP/Claude Code process clock) predate sessions.created_at
  // (a Postgres server-side timestamp), causing all events to be silently excluded.
  const allOtelEventVMs = useMemo(
    () => createOtelEventVMs(initialOtelEvents),
    [initialOtelEvents],
  )

  // OTEL event view models — tool use events belong in the timeline
  const otelEventVMs = useMemo(() => {
    const TOOL_EVENT_SUFFIXES = new Set(['tool_result', 'hook_tool_result'])
    return allOtelEventVMs.filter(ev => {
      const stripped = ev.eventName.replace(/^claude_code\./, '').replace(/^gen_ai\./, '')
      // Match Claude Code native names (tool_result, hook_tool_result)
      // and hook-emitted names (tool.Read, tool.Edit, tool.Bash, etc.)
      return TOOL_EVENT_SUFFIXES.has(stripped) || ev.eventName.startsWith('tool.')
    })
  }, [allOtelEventVMs])

  const otelSessionId = allOtelEventVMs.length > 0
    ? allOtelEventVMs[0].sessionId
    : null

  // Build OTEL detail lookup (all events, for detail panel)
  const otelDetails = useMemo(() => {
    const map: Record<string, OtelEventVM> = {}
    for (const ev of allOtelEventVMs) {
      map[ev.id] = ev
    }
    return map
  }, [allOtelEventVMs])
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const hasAppliedDefault = useRef(false)

  // --- State ---
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('content')
  const [activeTypeFilters, setActiveTypeFilters] = useState<
    Set<ThoughtDisplayType>
  >(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('decisions')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(
    new Set(),
  )

  // --- Debounce search ---
  useEffect(() => {
    if (search === '') {
      setDebouncedSearch('')
      return
    }
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // --- Type counts (from FULL rows, stable regardless of filters) ---
  const typeCounts = useMemo(() => {
    const counts: Record<ThoughtDisplayType, number> = {
      reasoning: 0,
      decision_frame: 0,
      action_report: 0,
      belief_snapshot: 0,
      assumption_update: 0,
      context_snapshot: 0,
      progress: 0,
      finding: 0,
      synthesis: 0,
      question: 0,
      conclusion: 0,
    }
    for (const row of rows) {
      counts[row.displayType]++
    }
    return counts
  }, [rows])

  // --- Combined filter pipeline ---
  const { filteredRows, searchResult } = useMemo((): {
    filteredRows: typeof rows
    searchResult: SearchResult | null
  } => {
    let result = rows

    // [SPEC-000] Run filter
    if (selectedRunId) {
      result = result.filter((r) => r.runId === selectedRunId)
    }

    // [SPEC-001] Type filter (OR logic)
    if (activeTypeFilters.size > 0) {
      result = result.filter((r) => activeTypeFilters.has(r.displayType))
    }

    // [SPEC-002] Text search with match counting
    const q = debouncedSearch.trim().toLowerCase()
    if (q === '') {
      return { filteredRows: result, searchResult: null }
    }

    const sr = computeSearchResults(result, details, q, searchMode)
    const filtered = result.filter((r) => sr.matchingRowIds.has(r.id))

    return { filteredRows: filtered, searchResult: sr }
  }, [rows, details, activeTypeFilters, debouncedSearch, searchMode, selectedRunId])

  // --- Type filter handlers ---
  const handleTypeFilterToggle = useCallback(
    (type: ThoughtDisplayType) => {
      setActiveTypeFilters((prev) => {
        const next = new Set(prev)
        if (next.has(type)) {
          next.delete(type)
        } else {
          next.add(type)
        }
        return next
      })
    },
    [],
  )

  const handleTypeFilterClear = useCallback(() => {
    setActiveTypeFilters(new Set())
  }, [])

  // --- Decision grouping (SPEC-004) ---
  const decisionGroups = useMemo(() => {
    if (viewMode !== 'decisions') return null
    return groupByDecisions(filteredRows, details)
  }, [viewMode, filteredRows, details])

  // --- Phase detection (SPEC-003) ---
  const phases = useMemo(
    () => detectPhases(rows, details),
    [rows, details],
  )

  // Hide phases with zero visible thoughts after filtering
  const visiblePhases = useMemo(() => {
    if (phases.length === 0) return phases
    const filteredIds = new Set(filteredRows.map((r) => r.id))
    return phases.filter((phase) => {
      for (let i = phase.startIndex; i <= phase.endIndex; i++) {
        if (rows[i] && filteredIds.has(rows[i].id)) return true
      }
      return false
    })
  }, [phases, filteredRows, rows])

  const handlePhaseToggle = useCallback((phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }, [])

  const hasActiveFilters =
    activeTypeFilters.size > 0 || debouncedSearch.trim() !== '' || selectedRunId !== null

  // Build the list of ThoughtDetailVMs for export
  const exportThoughts = useMemo(() => {
    return filteredRows.map((r) => details[r.id]).filter(Boolean)
  }, [filteredRows, details])

  const runIds = useMemo(() => {
    const ids = new Set(rows.map((r) => r.runId).filter(Boolean) as string[])
    return Array.from(ids)
  }, [rows])

  // --- Merged timeline (thoughts + tool use events) ---
  const timelineItems = useMemo(
    () => mergeTimeline(filteredRows, otelEventVMs),
    [filteredRows, otelEventVMs],
  )

  // --- Thought selection ---
  const thoughtParam = searchParams.get('thought')

  const selectedId = (() => {
    if (!thoughtParam || rows.length === 0) return null
    const num = Number(thoughtParam)
    if (Number.isNaN(num)) return null
    const match = rows.find((r) => r.thoughtNumber === num)
    return match?.id ?? null
  })()

  const setThoughtParam = useCallback(
    (thoughtNumber: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('thought', String(thoughtNumber))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  // Track OTEL event selection separately (not in URL)
  const [selectedOtelId, setSelectedOtelId] = useState<string | null>(null)

  const handleSelect = useCallback(
    (id: string) => {
      // Check if it's a thought or OTEL event
      const thoughtRow = rows.find((r) => r.id === id)
      if (thoughtRow) {
        setSelectedOtelId(null)
        setThoughtParam(thoughtRow.thoughtNumber)
      } else if (otelDetails[id]) {
        setSelectedOtelId(id)
      }
    },
    [rows, otelDetails, setThoughtParam],
  )

  // Effective selected ID: OTEL selection takes priority when set
  const effectiveSelectedId = selectedOtelId ?? selectedId

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (timelineItems.length === 0) return
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()

      const currentIdx = effectiveSelectedId
        ? timelineItems.findIndex((r) => r.id === effectiveSelectedId)
        : -1

      let nextIdx: number
      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < timelineItems.length - 1 ? currentIdx + 1 : 0
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : timelineItems.length - 1
      }

      const nextItem = timelineItems[nextIdx]
      if (nextItem) {
        handleSelect(nextItem.id)
      }
    },
    [timelineItems, effectiveSelectedId, handleSelect],
  )

  // Default selection
  useEffect(() => {
    if (rows.length === 0 || thoughtParam || hasAppliedDefault.current) return
    hasAppliedDefault.current = true

    const defaultRow =
      sessionStatus === 'active' ? rows[rows.length - 1] : rows[0]
    if (defaultRow) {
      setThoughtParam(defaultRow.thoughtNumber)
    }
  }, [rows, thoughtParam, sessionStatus, setThoughtParam])

  // Scroll selected item into view
  useEffect(() => {
    if (!effectiveSelectedId) return
    const el = document.querySelector(`[data-thought-id="${effectiveSelectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [effectiveSelectedId])

  const debouncedQuery = debouncedSearch.trim()

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-8 items-start">
      {/* Left Column: Trace List */}
      <div
        className="w-full sticky top-6 border-4 border-foreground bg-background shadow-brutal overflow-hidden flex flex-col h-[calc(100vh-12rem)] group"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="absolute inset-0 scanlines opacity-5 pointer-events-none z-0"></div>
        <SessionTraceToolbar
          isLive={isLive}
          sessionStatus={sessionStatus}
          search={search}
          onSearchChange={setSearch}
          searchResult={searchResult}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          activeTypeFilters={activeTypeFilters}
          onTypeFilterToggle={handleTypeFilterToggle}
          onTypeFilterClear={handleTypeFilterClear}
          typeCounts={typeCounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          runIds={runIds}
          selectedRunId={selectedRunId}
          onRunSelect={setSelectedRunId}
          exportSlot={
            <ExportDropdown
              session={sessionVM}
              thoughts={exportThoughts}
              hasActiveFilters={hasActiveFilters}
            />
          }
        />

        <SessionIdDiagnostic
          thoughtboxSessionId={sessionId}
          otelSessionId={otelSessionId}
          otelShown={otelEventVMs.length}
          otelTotal={otelTotalCount}
        />

        <div className="flex-1 overflow-y-auto relative z-10">
          {viewMode === 'decisions' && decisionGroups ? (
            <DecisionTimeline
              data={decisionGroups}
              selectedId={effectiveSelectedId}
              onSelect={handleSelect}
              searchQuery={debouncedQuery}
            />
          ) : (
            <SessionTimeline
              rows={timelineItems}
              selectedId={effectiveSelectedId}
              onSelect={handleSelect}
              searchQuery={debouncedQuery}
              phases={viewMode === 'full' ? visiblePhases : []}
              collapsedPhases={collapsedPhases}
              onPhaseToggle={handlePhaseToggle}
            />
          )}
        </div>
      </div>

      {/* Right Column: Selected Detail */}
      <div className="w-full sticky top-6 border-4 border-foreground bg-background shadow-brutal overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
        <div className="absolute inset-0 dots-pattern opacity-5 pointer-events-none z-0"></div>
        <div className="reticle-tl text-foreground z-20"></div>
        <div className="reticle-tr text-foreground z-20"></div>
        <div className="reticle-bl text-foreground z-20"></div>
        <div className="reticle-br text-foreground z-20"></div>
        
        <ThoughtDetailPanel
          detail={
            effectiveSelectedId
              ? (details[effectiveSelectedId] ?? otelDetails[effectiveSelectedId] ?? null)
              : null
          }
          positionIndex={
            effectiveSelectedId
              ? timelineItems.findIndex((r) => r.id === effectiveSelectedId)
              : undefined
          }
          totalCount={timelineItems.length}
          hasPrev={
            effectiveSelectedId
              ? timelineItems.findIndex((r) => r.id === effectiveSelectedId) > 0
              : false
          }
          hasNext={
            effectiveSelectedId
              ? timelineItems.findIndex((r) => r.id === effectiveSelectedId) <
                timelineItems.length - 1
              : false
          }
          onPrev={() => {
            if (!effectiveSelectedId) return
            const idx = timelineItems.findIndex((r) => r.id === effectiveSelectedId)
            if (idx > 0) handleSelect(timelineItems[idx - 1].id)
          }}
          onNext={() => {
            if (!effectiveSelectedId) return
            const idx = timelineItems.findIndex((r) => r.id === effectiveSelectedId)
            if (idx < timelineItems.length - 1)
              handleSelect(timelineItems[idx + 1].id)
          }}
          searchQuery={debouncedQuery}
        />
      </div>
    </div>
  )
}
