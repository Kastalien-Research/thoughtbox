import type { ThoughtDisplayType } from '@/lib/session/view-models'
import type { RawThoughtRecord } from '@/lib/session/view-models'

export type SessionSummary = {
  typeCounts: Record<ThoughtDisplayType, number>
  totalThoughts: number
  branchCount: number
  revisionCount: number
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  } | null
  tags: string[]
}

export function computeSessionSummary(
  thoughts: RawThoughtRecord[],
  sessionTags: string[],
): SessionSummary {
  const typeCounts: Record<ThoughtDisplayType, number> = {
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

  const branchIds = new Set<string>()
  let revisionCount = 0
  const confidenceCounts = { high: 0, medium: 0, low: 0 }
  let hasConfidence = false

  for (const t of thoughts) {
    const type = t.thoughtType ?? 'reasoning'
    typeCounts[type]++

    if (t.branchId) branchIds.add(t.branchId)
    if (t.isRevision || t.revisesThought != null) revisionCount++
    if (t.confidence) {
      confidenceCounts[t.confidence]++
      hasConfidence = true
    }
  }

  return {
    typeCounts,
    totalThoughts: thoughts.length,
    branchCount: branchIds.size,
    revisionCount,
    confidenceDistribution: hasConfidence ? confidenceCounts : null,
    tags: sessionTags,
  }
}
