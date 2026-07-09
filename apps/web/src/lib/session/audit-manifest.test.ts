import { describe, it, expect } from 'vitest'
import { parseAuditManifest } from './audit-manifest'

const fullManifest = {
  sessionId: 'sess-1',
  generatedAt: '2026-07-01T12:00:00.000Z',
  thoughtCounts: {
    total: 12,
    reasoning: 6,
    decision_frame: 2,
    action_report: 2,
    belief_snapshot: 0,
    assumption_update: 1,
    context_snapshot: 0,
    progress: 1,
    action_receipt: 0,
  },
  decisions: {
    total: 2,
    byConfidence: { high: 1, medium: 1, low: 0 },
  },
  actions: {
    total: 2,
    successful: 1,
    failed: 1,
    reversible: 1,
    irreversible: 1,
    partiallyReversible: 0,
  },
  gaps: [
    {
      type: 'decision_without_action',
      thoughtNumber: 4,
      description: 'Decision at thought 4 has no subsequent action report',
    },
    {
      type: 'critique_override',
      thoughtNumber: 7,
      description: 'Critique at thought 7 was overridden without address',
    },
  ],
  assumptionFlips: 1,
  critiques: { generated: 3, addressed: 2, overridden: 1 },
}

describe('parseAuditManifest', () => {
  it('parses a complete manifest', () => {
    const parsed = parseAuditManifest(fullManifest)
    expect(parsed).not.toBeNull()
    expect(parsed!.sessionId).toBe('sess-1')
    expect(parsed!.thoughtCounts.total).toBe(12)
    expect(parsed!.decisions.byConfidence).toEqual({ high: 1, medium: 1, low: 0 })
    expect(parsed!.actions.failed).toBe(1)
    expect(parsed!.gaps).toHaveLength(2)
    expect(parsed!.gaps[0].type).toBe('decision_without_action')
    expect(parsed!.assumptionFlips).toBe(1)
    expect(parsed!.critiques).toEqual({ generated: 3, addressed: 2, overridden: 1 })
  })

  it('returns null for null / undefined / non-objects', () => {
    expect(parseAuditManifest(null)).toBeNull()
    expect(parseAuditManifest(undefined)).toBeNull()
    expect(parseAuditManifest('manifest')).toBeNull()
    expect(parseAuditManifest(42)).toBeNull()
    expect(parseAuditManifest([fullManifest])).toBeNull()
  })

  it('returns null when required identity fields are missing', () => {
    expect(parseAuditManifest({})).toBeNull()
    expect(
      parseAuditManifest({ sessionId: 'x', generatedAt: '2026-01-01T00:00:00Z' }),
    ).toBeNull()
    expect(
      parseAuditManifest({ generatedAt: 'x', thoughtCounts: {} }),
    ).toBeNull()
  })

  it('defaults missing numeric sections to zero', () => {
    const parsed = parseAuditManifest({
      sessionId: 'sess-2',
      generatedAt: '2026-07-01T12:00:00.000Z',
      thoughtCounts: { total: 3 },
    })
    expect(parsed).not.toBeNull()
    expect(parsed!.thoughtCounts.total).toBe(3)
    expect(parsed!.thoughtCounts.reasoning).toBe(0)
    expect(parsed!.decisions.total).toBe(0)
    expect(parsed!.actions.total).toBe(0)
    expect(parsed!.critiques.generated).toBe(0)
    expect(parsed!.assumptionFlips).toBe(0)
    expect(parsed!.gaps).toEqual([])
  })

  it('drops malformed gap entries but keeps valid ones', () => {
    const parsed = parseAuditManifest({
      ...fullManifest,
      gaps: [
        { type: 'unknown_gap', thoughtNumber: 1, description: 'nope' },
        'not-an-object',
        { type: 'critique_override', thoughtNumber: 9, description: 'kept' },
        { type: 'decision_without_action' },
      ],
    })
    expect(parsed).not.toBeNull()
    expect(parsed!.gaps).toEqual([
      { type: 'critique_override', thoughtNumber: 9, description: 'kept' },
      { type: 'decision_without_action', thoughtNumber: 0, description: '' },
    ])
  })

  it('ignores non-numeric values in numeric fields', () => {
    const parsed = parseAuditManifest({
      sessionId: 'sess-3',
      generatedAt: '2026-07-01T12:00:00.000Z',
      thoughtCounts: { total: 'five' },
      assumptionFlips: NaN,
    })
    expect(parsed).not.toBeNull()
    expect(parsed!.thoughtCounts.total).toBe(0)
    expect(parsed!.assumptionFlips).toBe(0)
  })
})
