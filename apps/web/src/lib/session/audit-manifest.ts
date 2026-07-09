/**
 * AUDIT-003: Session audit manifest — auto-generated server-side at session
 * close and persisted to `sessions.audit_manifest` (jsonb). This module
 * mirrors the server's `AuditManifest` interface (server repo
 * `src/persistence/types.ts`) and provides a defensive parser for rendering.
 */

export type AuditGapType = 'decision_without_action' | 'critique_override'

export interface AuditGap {
  type: AuditGapType
  thoughtNumber: number
  description: string
}

export interface AuditManifest {
  sessionId: string
  generatedAt: string
  thoughtCounts: {
    total: number
    reasoning: number
    decision_frame: number
    action_report: number
    belief_snapshot: number
    assumption_update: number
    context_snapshot: number
    progress: number
    action_receipt: number
    finding: number
    synthesis: number
    question: number
    conclusion: number
  }
  decisions: {
    total: number
    byConfidence: { high: number; medium: number; low: number }
  }
  actions: {
    total: number
    successful: number
    failed: number
    reversible: number
    irreversible: number
    partiallyReversible: number
  }
  gaps: AuditGap[]
  assumptionFlips: number
  critiques: {
    generated: number
    addressed: number
    overridden: number
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseGaps(value: unknown): AuditGap[] {
  if (!Array.isArray(value)) return []
  const gaps: AuditGap[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    if (
      item.type !== 'decision_without_action' &&
      item.type !== 'critique_override'
    ) {
      continue
    }
    gaps.push({
      type: item.type,
      thoughtNumber: num(item.thoughtNumber),
      description: typeof item.description === 'string' ? item.description : '',
    })
  }
  return gaps
}

/**
 * Parse the raw `sessions.audit_manifest` jsonb value into a typed
 * AuditManifest. Returns null when the value is absent or not
 * manifest-shaped (sessions closed before AUDIT-003 landed have null here).
 * Numeric fields are individually defaulted to 0 so a partially populated
 * manifest still renders.
 */
export function parseAuditManifest(value: unknown): AuditManifest | null {
  if (!isRecord(value)) return null
  // Minimal shape check: the generator always writes these three.
  if (
    typeof value.sessionId !== 'string' ||
    typeof value.generatedAt !== 'string' ||
    !isRecord(value.thoughtCounts)
  ) {
    return null
  }

  const thoughtCounts = value.thoughtCounts
  const decisions = isRecord(value.decisions) ? value.decisions : {}
  const byConfidence = isRecord(decisions.byConfidence)
    ? decisions.byConfidence
    : {}
  const actions = isRecord(value.actions) ? value.actions : {}
  const critiques = isRecord(value.critiques) ? value.critiques : {}

  return {
    sessionId: value.sessionId,
    generatedAt: value.generatedAt,
    thoughtCounts: {
      total: num(thoughtCounts.total),
      reasoning: num(thoughtCounts.reasoning),
      decision_frame: num(thoughtCounts.decision_frame),
      action_report: num(thoughtCounts.action_report),
      belief_snapshot: num(thoughtCounts.belief_snapshot),
      assumption_update: num(thoughtCounts.assumption_update),
      context_snapshot: num(thoughtCounts.context_snapshot),
      progress: num(thoughtCounts.progress),
      action_receipt: num(thoughtCounts.action_receipt),
      finding: num(thoughtCounts.finding),
      synthesis: num(thoughtCounts.synthesis),
      question: num(thoughtCounts.question),
      conclusion: num(thoughtCounts.conclusion),
    },
    decisions: {
      total: num(decisions.total),
      byConfidence: {
        high: num(byConfidence.high),
        medium: num(byConfidence.medium),
        low: num(byConfidence.low),
      },
    },
    actions: {
      total: num(actions.total),
      successful: num(actions.successful),
      failed: num(actions.failed),
      reversible: num(actions.reversible),
      irreversible: num(actions.irreversible),
      partiallyReversible: num(actions.partiallyReversible),
    },
    gaps: parseGaps(value.gaps),
    assumptionFlips: num(value.assumptionFlips),
    critiques: {
      generated: num(critiques.generated),
      addressed: num(critiques.addressed),
      overridden: num(critiques.overridden),
    },
  }
}
