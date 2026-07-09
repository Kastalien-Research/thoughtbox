import { format, formatDistanceToNow, differenceInMilliseconds } from 'date-fns'

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Raw Persistence Records
 * These approximate the data shape coming from the MCP server or database
 */

export type RawThoughtRecord = {
  id: string
  runId?: string
  thoughtNumber?: number
  totalThoughts?: number
  thought: string
  timestamp: string
  nextThoughtNeeded?: boolean

  isRevision?: boolean
  revisesThought?: number

  branchId?: string
  branchFromThought?: number

  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report' |
    'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress' |
    'finding' | 'synthesis' | 'question' | 'conclusion'

  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }

  agentId?: string
  agentName?: string
  contentHash?: string
  parentHash?: string
  critique?: unknown
}

/**
 * Map a raw Supabase DB row (snake_case) to RawThoughtRecord (camelCase).
 * Used by Postgres Changes realtime handlers where payload.new is the raw DB row.
 */
export function fromThoughtsRow(row: Record<string, unknown>): RawThoughtRecord {
  return {
    id: row.id as string,
    thoughtNumber: row.thought_number != null ? row.thought_number as number : undefined,
    totalThoughts: row.total_thoughts != null ? row.total_thoughts as number : undefined,
    thought: row.thought as string,
    timestamp: row.timestamp as string,
    nextThoughtNeeded: row.next_thought_needed != null ? row.next_thought_needed as boolean : undefined,
    isRevision: row.is_revision != null ? row.is_revision as boolean : undefined,
    revisesThought: row.revises_thought != null ? row.revises_thought as number : undefined,
    branchId: row.branch_id != null ? row.branch_id as string : undefined,
    branchFromThought: row.branch_from_thought != null ? row.branch_from_thought as number : undefined,
    thoughtType: row.thought_type as RawThoughtRecord['thoughtType'],
    confidence: row.confidence as RawThoughtRecord['confidence'],
    options: row.options as RawThoughtRecord['options'],
    actionResult: row.action_result as RawThoughtRecord['actionResult'],
    beliefs: row.beliefs as RawThoughtRecord['beliefs'],
    assumptionChange: row.assumption_change as RawThoughtRecord['assumptionChange'],
    contextData: row.context_data as RawThoughtRecord['contextData'],
    progressData: row.progress_data as RawThoughtRecord['progressData'],
    agentId: row.agent_id != null ? row.agent_id as string : undefined,
    agentName: row.agent_name != null ? row.agent_name as string : undefined,
    contentHash: row.content_hash != null ? row.content_hash as string : undefined,
    parentHash: row.parent_hash != null ? row.parent_hash as string : undefined,
    critique: row.critique ?? undefined,
  }
}

export type RawSessionRecord = {
  id: string
  title?: string
  tags?: string[]
  createdAt: string
  completedAt?: string
  updatedAt?: string
  status: 'active' | 'completed' | 'abandoned'
  thoughts?: RawThoughtRecord[]
}

/**
 * View Models
 * These represent the normalized state consumed by the UI components
 */

export type SessionSignals = {
  decisions: number
  assumptions: number
  beliefs: number
  actions: number
  revisions: number
}

export type SessionSummaryVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  tags: string[]
  thoughtCount?: number
  otelEventCount?: number
  signals?: SessionSignals
  startedAtISO: string
  startedAtLabel: string
  durationLabel: string
  href: string
}

export type SessionDetailVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  tags: string[]
  startedAtISO: string
  startedAtLabel: string
  completedAtISO?: string
  durationLabel: string
  thoughtCount: number
  lastUpdatedAtISO?: string
  isLiveCapable: boolean
}

export type ThoughtDisplayType =
  | 'reasoning'
  | 'decision_frame'
  | 'action_report'
  | 'belief_snapshot'
  | 'assumption_update'
  | 'context_snapshot'
  | 'progress'
  | 'finding'
  | 'synthesis'
  | 'question'
  | 'conclusion'

export type ThoughtRowVM = {
  id: string
  runId?: string
  thoughtNumber: number
  totalThoughts?: number
  shortId: string
  previewText: string
  timestampISO: string
  relativeTimeLabel: string
  absoluteTimeLabel: string
  displayType: ThoughtDisplayType
  isTyped: boolean
  isRevision: boolean
  revisesThought?: number
  laneIndex: number
  laneColorToken: string
  branchId?: string
  branchLabel?: string
  branchFromThought?: number
  showGapBefore: boolean
  gapLabel?: string
  searchIndexText: string
}

export type ThoughtDetailVM = ThoughtRowVM & {
  rawThought: string
  nextThoughtNeeded?: boolean
  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }
  debugMeta: Record<string, unknown>
}

/**
 * Adapter Functions
 */

export function createSessionSummaryVM(raw: RawSessionRecord, workspaceSlug: string): SessionSummaryVM {
  const shortId = raw.id.slice(0, 7)
  const title = raw.title?.trim()
  const startedAt = new Date(raw.createdAt)
  
  let durationLabel = '—'
  if (raw.completedAt) {
    const ms = differenceInMilliseconds(new Date(raw.completedAt), startedAt)
    durationLabel = formatDuration(ms)
  } else if (raw.status === 'active') {
    // For active sessions, we use updated at or just show a pulse
    const end = raw.updatedAt ? new Date(raw.updatedAt) : new Date()
    const ms = differenceInMilliseconds(end, startedAt)
    durationLabel = formatDuration(ms)
  }

  const thoughtCount = raw.thoughts?.length

  return {
    id: raw.id,
    shortId,
    title: title || undefined,
    status: raw.status,
    tags: raw.tags || [],
    thoughtCount,
    startedAtISO: raw.createdAt,
    startedAtLabel: format(startedAt, 'MMM d, yyyy HH:mm'),
    durationLabel,
    href: `/w/${workspaceSlug}/sessions/${raw.id}`
  }
}

export function createSessionDetailVM(raw: RawSessionRecord): SessionDetailVM {
  const shortId = raw.id.slice(0, 7)
  const title = raw.title?.trim()
  const startedAt = new Date(raw.createdAt)
  
  let durationLabel = '—'
  if (raw.completedAt) {
    const ms = differenceInMilliseconds(new Date(raw.completedAt), startedAt)
    durationLabel = formatDuration(ms)
  } else if (raw.status === 'active') {
    const end = raw.updatedAt ? new Date(raw.updatedAt) : new Date()
    const ms = differenceInMilliseconds(end, startedAt)
    durationLabel = formatDuration(ms)
  }

  return {
    id: raw.id,
    shortId,
    title: title || undefined,
    status: raw.status,
    tags: raw.tags || [],
    startedAtISO: raw.createdAt,
    startedAtLabel: format(startedAt, 'MMM d, yyyy HH:mm'),
    completedAtISO: raw.completedAt,
    durationLabel,
    thoughtCount: raw.thoughts?.length || 0,
    lastUpdatedAtISO: raw.updatedAt || raw.completedAt || raw.createdAt,
    isLiveCapable: raw.status === 'active'
  }
}

export function createThoughtViewModels(rawThoughts: RawThoughtRecord[]): { rows: ThoughtRowVM[], details: Record<string, ThoughtDetailVM> } {
  // Sort thoughts robustly: by thoughtNumber if present, falling back to timestamp
  const sorted = [...rawThoughts].sort((a, b) => {
    if (a.thoughtNumber != null && b.thoughtNumber != null) {
      return a.thoughtNumber - b.thoughtNumber
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })

  // Determine lane assignments based on branch topology
  // Lane 0 is main chain. We assign sequential lanes to new branches as they appear.
  const laneAssignments = new Map<string, number>()
  laneAssignments.set('__main__', 0)
  
  const laneColors = [
    'primary',
    'secondary',
    'secondary',
    'secondary',
    'secondary',
    'secondary'
  ]

  let nextAvailableLane = 1

  const rows: ThoughtRowVM[] = []
  const details: Record<string, ThoughtDetailVM> = {}

  let lastTimestamp: Date | null = null

  sorted.forEach((raw, index) => {
    const isRevision = raw.isRevision === true || raw.revisesThought != null
    const displayType = raw.thoughtType ?? 'reasoning'
    const isTyped = raw.thoughtType != null

    // Branch lane assignment
    const branchKey = raw.branchId || '__main__'
    if (!laneAssignments.has(branchKey)) {
      laneAssignments.set(branchKey, nextAvailableLane++)
    }
    const laneIndex = laneAssignments.get(branchKey)!
    const laneColorToken = laneColors[laneIndex % laneColors.length]

    // Timestamps and gap calculation
    const currentTimestamp = new Date(raw.timestamp)
    let showGapBefore = false
    let gapLabel: string | undefined

    if (lastTimestamp) {
      const diffMs = currentTimestamp.getTime() - lastTimestamp.getTime()
      if (diffMs > 5 * 60 * 1000) { // > 5 minutes
        showGapBefore = true
        if (diffMs > 60 * 60 * 1000) {
          const hours = Math.floor(diffMs / (60 * 60 * 1000))
          const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
          gapLabel = `${hours}h ${mins}m gap`
        } else {
          gapLabel = `${Math.floor(diffMs / (60 * 1000))}m gap`
        }
      }
    }
    lastTimestamp = currentTimestamp

    // Preview text (first line)
    const previewText = raw.thought.split('\n')[0].substring(0, 120).trim() + (raw.thought.length > 120 ? '\u2026' : '')

    // Search index string
    const searchParts = [
      raw.thought,
      raw.branchId,
      raw.thoughtType,
      raw.actionResult?.tool,
      raw.actionResult?.target,
      raw.assumptionChange?.text,
      raw.progressData?.task,
      raw.progressData?.note
    ].filter(Boolean).map(s => String(s).toLowerCase())
    
    // Add nested text like option labels or belief entities
    raw.options?.forEach(opt => searchParts.push(opt.label.toLowerCase(), opt.reason?.toLowerCase() || ''))
    raw.beliefs?.entities.forEach(ent => searchParts.push(ent.name.toLowerCase(), ent.state.toLowerCase()))

    const searchIndexText = searchParts.join(' ')

    const rowVM: ThoughtRowVM = {
      id: raw.id,
      runId: raw.runId,
      thoughtNumber: raw.thoughtNumber ?? (index + 1), // fallback
      totalThoughts: raw.totalThoughts,
      shortId: raw.id.slice(0, 7),
      previewText,
      timestampISO: raw.timestamp,
      relativeTimeLabel: formatDistanceToNow(currentTimestamp, { addSuffix: true }),
      absoluteTimeLabel: format(currentTimestamp, 'MMM d, yyyy HH:mm:ss'),
      displayType,
      isTyped,
      isRevision,
      revisesThought: raw.revisesThought,
      laneIndex,
      laneColorToken,
      branchId: raw.branchId,
      branchLabel: raw.branchId ? `Branch: ${raw.branchId.slice(0, 6)}` : undefined,
      branchFromThought: raw.branchFromThought,
      showGapBefore,
      gapLabel,
      searchIndexText
    }

    // Extract debugging metadata
    const debugMeta: Record<string, unknown> = {}
    const knownKeys = new Set([
      'id', 'thoughtNumber', 'totalThoughts', 'thought', 'timestamp',
      'nextThoughtNeeded', 'isRevision', 'revisesThought', 'branchId',
      'branchFromThought', 'thoughtType', 'confidence', 'options',
      'actionResult', 'beliefs', 'assumptionChange', 'contextData', 'progressData'
    ])
    
    for (const [k, v] of Object.entries(raw)) {
      if (!knownKeys.has(k)) {
        debugMeta[k] = v
      }
    }

    const detailVM: ThoughtDetailVM = {
      ...rowVM,
      rawThought: raw.thought,
      nextThoughtNeeded: raw.nextThoughtNeeded,
      confidence: raw.confidence,
      options: raw.options,
      actionResult: raw.actionResult,
      beliefs: raw.beliefs,
      assumptionChange: raw.assumptionChange,
      contextData: raw.contextData,
      progressData: raw.progressData,
      debugMeta
    }

    rows.push(rowVM)
    details[raw.id] = detailVM
  })

  return { rows, details }
}

/**
 * OTEL Event View Models
 */

export type RawOtelEventRecord = {
  id: string
  event_type: string
  event_name: string
  severity: string | null
  timestamp_at: string
  body: string | null
  metric_value: number | null
  event_attrs: Record<string, unknown> | null
  session_id: string | null
}

export type OtelEventVM = {
  id: string
  kind: 'otel_event'
  eventType: 'log' | 'metric'
  eventName: string
  severity: string | null
  timestampISO: string
  relativeTimeLabel: string
  absoluteTimeLabel: string
  body: string | null
  metricValue: number | null
  eventAttrs: Record<string, unknown>
  sessionId: string | null
}

export type TimelineItem =
  | (ThoughtRowVM & { kind: 'thought' })
  | OtelEventVM

/** Timestamps before 2020 are almost certainly epoch-zero or garbage data */
const MIN_VALID_TIMESTAMP = new Date('2020-01-01T00:00:00Z').getTime()

export function createOtelEventVMs(
  rawEvents: RawOtelEventRecord[],
): OtelEventVM[] {
  return rawEvents.map((raw) => {
    const ts = new Date(raw.timestamp_at)
    const isValid = ts.getTime() >= MIN_VALID_TIMESTAMP
    return {
      id: raw.id,
      kind: 'otel_event' as const,
      eventType: raw.event_type === 'metric' ? 'metric' : 'log',
      eventName: raw.event_name,
      severity: raw.severity,
      timestampISO: raw.timestamp_at,
      relativeTimeLabel: isValid
        ? formatDistanceToNow(ts, { addSuffix: true })
        : 'unknown time',
      absoluteTimeLabel: isValid
        ? format(ts, 'MMM d, yyyy HH:mm:ss')
        : 'Invalid timestamp',
      body: raw.body,
      metricValue: raw.metric_value,
      eventAttrs: (raw.event_attrs ?? {}) as Record<string, unknown>,
      sessionId: raw.session_id,
    }
  })
}

export function mergeTimeline(
  thoughts: ThoughtRowVM[],
  otelEvents: OtelEventVM[],
): TimelineItem[] {
  if (otelEvents.length === 0) {
    return thoughts.map((t) => ({ ...t, kind: 'thought' as const }))
  }

  const taggedThoughts: TimelineItem[] = thoughts.map((t) => ({
    ...t,
    kind: 'thought' as const,
  }))

  if (thoughts.length === 0) {
    return otelEvents
  }

  // Drop OTEL events that predate the first thought — they belong to
  // activity before the run started and should not appear in the timeline.
  const firstThoughtTime = new Date(taggedThoughts[0].timestampISO).getTime()
  const inScopeEvents = otelEvents.filter(
    (ev) => new Date(ev.timestampISO).getTime() >= firstThoughtTime,
  )

  if (inScopeEvents.length === 0) {
    return taggedThoughts
  }

  const result: TimelineItem[] = []
  let otelIdx = 0

  for (let i = 0; i < taggedThoughts.length; i++) {
    const thought = taggedThoughts[i]
    const thoughtTime = new Date(thought.timestampISO).getTime()

    // Insert OTEL events that occurred before this thought
    while (otelIdx < inScopeEvents.length) {
      const eventTime = new Date(inScopeEvents[otelIdx].timestampISO).getTime()
      if (eventTime < thoughtTime) {
        result.push(inScopeEvents[otelIdx])
        otelIdx++
      } else {
        break
      }
    }

    result.push(thought)
  }

  // Remaining OTEL events after the last thought
  while (otelIdx < inScopeEvents.length) {
    result.push(inScopeEvents[otelIdx])
    otelIdx++
  }

  return result
}

/**
 * Build a human-readable label from an OTEL event name + its attributes.
 * Uses tool_name, model, decision, type from attrs to disambiguate rows
 * that otherwise all show the same event name.
 */
export function formatOtelDisplayLabel(
  eventName: string,
  attrs: Record<string, unknown>,
): { label: string; detail: string | null } {
  const stripped = eventName
    .replace(/^claude_code\./, '')
    .replace(/^gen_ai\./, '')

  const toolName = (attrs['tool.name'] ?? attrs['tool_name'] ?? null) as string | null
  const model = attrs['model'] as string | null
  const decision = attrs['decision'] as string | null
  const tokenType = attrs['type'] as string | null

  // Hook-emitted events: "tool.Read", "tool.Edit", etc.
  if (eventName.startsWith('tool.')) {
    const hookToolName = toolName ?? eventName.slice(5)
    return {
      label: hookToolName === 'mcp_tool' ? 'MCP call' : hookToolName,
      detail: null,
    }
  }

  switch (stripped) {
    case 'tool_result':
    case 'hook_tool_result': {
      const displayTool = toolName === 'mcp_tool' ? 'MCP call' : toolName
      return {
        label: displayTool ? `${displayTool}` : 'tool result',
        detail: null,
      }
    }
    case 'tool_decision':
      return {
        label: toolName
          ? `${toolName} ${decision ?? 'decision'}`
          : `tool ${decision ?? 'decision'}`,
        detail: null,
      }
    case 'api_request':
      return {
        label: 'API request',
        detail: model?.replace('claude-', '') ?? null,
      }
    case 'api_error':
      return { label: 'API error', detail: model?.replace('claude-', '') ?? null }
    case 'user_prompt':
      return { label: 'user prompt', detail: null }
    case 'token.usage':
      return { label: 'token usage', detail: tokenType ?? null }
    case 'cost.usage':
      return { label: 'cost', detail: model?.replace('claude-', '') ?? null }
    case 'active_time.total':
      return { label: 'active time', detail: null }
    case 'lines_of_code.count':
      return { label: 'lines changed', detail: null }
    case 'code_edit_tool.decision':
      return {
        label: toolName ? `${toolName} edit` : 'code edit',
        detail: (attrs['language'] as string | null) ?? null,
      }
    case 'commit.count':
      return { label: 'commit', detail: null }
    case 'pull_request.count':
      return { label: 'pull request', detail: null }
    default: {
      const label = stripped.split('.').pop()?.replaceAll('_', ' ') ?? stripped
      return { label, detail: toolName ?? null }
    }
  }
}
