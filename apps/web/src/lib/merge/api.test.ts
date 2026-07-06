import { describe, it, expect } from 'vitest'
import { parseVerdict, parseMergeRecord, parseMergeList } from './api'

const validVerdict = {
  decision: 'Merge branch-a; branch-b rejected on failing perf evidence',
  confidence: 'high',
  mergedBranchIds: ['branch-a'],
  rejectedBranchIds: ['branch-b'],
  supersededNodeIds: ['node-1'],
  evidenceRefs: ['cell:3'],
  dissent: [
    {
      branchId: 'branch-b',
      summary: 'Alternative caching approach',
      reasonNotMerged: 'Evidence cell 3 failed under load',
    },
  ],
  conditions: ['Re-run perf suite after prod deploy'],
  reopenTriggers: ['p95 latency > 500ms'],
}

const validRecord = {
  id: 'merge-1',
  workspace_id: 'ws-1',
  parent_branch_ids: ['branch-a', 'branch-b'],
  base_ref: 'main',
  evidence_notebook_id: 'nb-1',
  evidence_hash: 'abc123',
  verdict: validVerdict,
  status: 'pending_approval',
  requested_by: 'agent-7',
  approved_by: null,
  created_at: '2026-07-06T00:00:00Z',
  decided_at: null,
  superseded_by: null,
}

describe('parseVerdict', () => {
  it('parses a complete verdict', () => {
    const verdict = parseVerdict(validVerdict)
    expect(verdict).not.toBeNull()
    expect(verdict!.confidence).toBe('high')
    expect(verdict!.dissent).toHaveLength(1)
    expect(verdict!.dissent[0].reasonNotMerged).toContain('cell 3')
    expect(verdict!.conditions).toEqual(['Re-run perf suite after prod deploy'])
    expect(verdict!.reopenTriggers).toEqual(['p95 latency > 500ms'])
  })

  it('forces unknown confidence to low (contract: prose-only merges)', () => {
    const verdict = parseVerdict({ ...validVerdict, confidence: 'certain' })
    expect(verdict!.confidence).toBe('low')
  })

  it('returns null for non-objects and drops malformed dissent entries', () => {
    expect(parseVerdict(null)).toBeNull()
    expect(parseVerdict('verdict')).toBeNull()
    const verdict = parseVerdict({
      ...validVerdict,
      dissent: ['bad', { branchId: 'x', summary: 's', reasonNotMerged: 'r' }],
    })
    expect(verdict!.dissent).toEqual([
      { branchId: 'x', summary: 's', reasonNotMerged: 'r' },
    ])
  })
})

describe('parseMergeRecord', () => {
  it('parses a complete record', () => {
    const record = parseMergeRecord(validRecord)
    expect(record).not.toBeNull()
    expect(record!.status).toBe('pending_approval')
    expect(record!.parent_branch_ids).toEqual(['branch-a', 'branch-b'])
    expect(record!.verdict?.decision).toContain('branch-a')
  })

  it('rejects records missing id, workspace, or with an unknown status', () => {
    expect(parseMergeRecord({ ...validRecord, id: undefined })).toBeNull()
    expect(parseMergeRecord({ ...validRecord, workspace_id: 42 })).toBeNull()
    expect(parseMergeRecord({ ...validRecord, status: 'contested' })).toBeNull()
  })

  it('tolerates null verdict (pending_evidence records)', () => {
    const record = parseMergeRecord({
      ...validRecord,
      status: 'pending_evidence',
      verdict: null,
    })
    expect(record).not.toBeNull()
    expect(record!.verdict).toBeNull()
  })
})

describe('parseMergeList', () => {
  it('accepts a bare array', () => {
    expect(parseMergeList([validRecord])).toHaveLength(1)
  })

  it('accepts a { merges } envelope', () => {
    expect(parseMergeList({ merges: [validRecord] })).toHaveLength(1)
  })

  it('drops invalid entries and tolerates junk payloads', () => {
    expect(parseMergeList({ merges: [validRecord, { id: 'only-id' }] })).toHaveLength(1)
    expect(parseMergeList('nope')).toEqual([])
    expect(parseMergeList(undefined)).toEqual([])
  })
})
