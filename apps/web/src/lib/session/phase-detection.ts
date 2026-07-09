import type { ThoughtRowVM, ThoughtDetailVM } from '@/lib/session/view-models'

export type Phase = {
  id: string
  label: string
  startIndex: number
  endIndex: number
  thoughtCount: number
  typeBreakdown: Record<string, number>
}

const MIN_SESSION_SIZE = 20
const MIN_PHASE_SIZE = 3
const GAP_THRESHOLD_MS = 30 * 60 * 1000

export function detectPhases(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
): Phase[] {
  if (rows.length < MIN_SESSION_SIZE) return []

  const boundaries: number[] = [0]

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const curr = rows[i]

    const gapMs =
      new Date(curr.timestampISO).getTime() -
      new Date(prev.timestampISO).getTime()
    if (gapMs > GAP_THRESHOLD_MS) {
      boundaries.push(i)
      continue
    }

    const prevDetail = details[prev.id]
    const currDetail = details[curr.id]
    if (
      prevDetail?.progressData &&
      currDetail?.progressData &&
      prevDetail.progressData.status !== currDetail.progressData.status
    ) {
      boundaries.push(i)
      continue
    }

    if (prev.displayType !== curr.displayType) {
      const runLength = countRunBackward(rows, i - 1)
      if (runLength >= MIN_PHASE_SIZE) {
        boundaries.push(i)
      }
    }
  }

  const rawPhases: { start: number; end: number }[] = []
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i]
    const end = i < boundaries.length - 1 ? boundaries[i + 1] - 1 : rows.length - 1
    rawPhases.push({ start, end })
  }

  const merged = mergeSmallPhases(rawPhases)
  if (merged.length <= 1) return []

  return merged.map((seg) => {
    const typeBreakdown: Record<string, number> = {}
    for (let i = seg.start; i <= seg.end; i++) {
      const type = rows[i].displayType
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1
    }

    return {
      id: `phase-${seg.start}`,
      label: generateLabel(rows, details, seg.start, typeBreakdown),
      startIndex: seg.start,
      endIndex: seg.end,
      thoughtCount: seg.end - seg.start + 1,
      typeBreakdown,
    }
  })
}

function countRunBackward(rows: ThoughtRowVM[], idx: number): number {
  const type = rows[idx].displayType
  let count = 1
  for (let i = idx - 1; i >= 0; i--) {
    if (rows[i].displayType !== type) break
    count++
  }
  return count
}

function mergeSmallPhases(
  phases: { start: number; end: number }[],
): { start: number; end: number }[] {
  if (phases.length <= 1) return phases

  const result: { start: number; end: number }[] = [phases[0]]
  for (let i = 1; i < phases.length; i++) {
    const size = phases[i].end - phases[i].start + 1
    if (size < MIN_PHASE_SIZE) {
      result[result.length - 1].end = phases[i].end
    } else {
      result.push({ ...phases[i] })
    }
  }
  return result
}

function generateLabel(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
  startIdx: number,
  typeBreakdown: Record<string, number>,
): string {
  const startRow = rows[startIdx]
  const startDetail = details[startRow.id]

  if (startDetail?.progressData?.task) {
    return startDetail.progressData.task
  }

  const total = Object.values(typeBreakdown).reduce((a, b) => a + b, 0)
  const dominant = Object.entries(typeBreakdown).sort(
    ([, a], [, b]) => b - a,
  )[0]
  if (dominant && dominant[1] / total > 0.6) {
    const labels: Record<string, string> = {
      reasoning: 'Reasoning Phase',
      decision_frame: 'Decision Phase',
      action_report: 'Action Phase',
      belief_snapshot: 'Belief Phase',
      assumption_update: 'Assumption Phase',
      context_snapshot: 'Context Phase',
      progress: 'Progress Phase',
      finding: 'Finding Phase',
      synthesis: 'Synthesis Phase',
      question: 'Question Phase',
      conclusion: 'Conclusion Phase',
    }
    return labels[dominant[0]] || 'Phase'
  }

  const words = startRow.previewText.split(/\s+/).slice(0, 6).join(' ')
  return words || 'Phase'
}
