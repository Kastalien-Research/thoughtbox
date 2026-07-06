import { describe, it, expect } from 'vitest'
import {
  aggregateBranches,
  buildRepoTimeline,
  maxBranchCount,
  type RepoSession,
} from './timeline'
import type { MergeRecord } from '@/lib/merge/api'

function session(overrides: Partial<RepoSession> & { id: string }): RepoSession {
  return {
    title: overrides.id,
    status: 'completed',
    createdAt: '2026-07-01T00:00:00Z',
    thoughtCount: 5,
    ...overrides,
  }
}

function merge(overrides: Partial<MergeRecord> & { id: string }): MergeRecord {
  return {
    workspace_id: 'ws-1',
    parent_branch_ids: [],
    base_ref: null,
    evidence_notebook_id: null,
    evidence_hash: null,
    verdict: null,
    status: 'approved',
    requested_by: 'agent-1',
    approved_by: 'user-1',
    created_at: '2026-07-01T00:00:00Z',
    decided_at: null,
    superseded_by: null,
    ...overrides,
  }
}

describe('aggregateBranches', () => {
  it('groups branch thoughts by session and branch, skipping main-line rows', () => {
    const branches = aggregateBranches([
      { session_id: 's1', branch_id: null, agent_id: 'a1' },
      { session_id: 's1', branch_id: 'alt-1', agent_id: 'a1' },
      { session_id: 's1', branch_id: 'alt-1', agent_id: 'a2' },
      { session_id: 's1', branch_id: 'alt-2', agent_id: null },
      { session_id: 's2', branch_id: 'alt-1', agent_id: 'a3' },
    ])

    expect(branches).toHaveLength(3)
    const s1alt1 = branches.find(
      (b) => b.sessionId === 's1' && b.branchId === 'alt-1',
    )
    expect(s1alt1).toMatchObject({ thoughtCount: 2, agentIds: ['a1', 'a2'] })
    const s1alt2 = branches.find(
      (b) => b.sessionId === 's1' && b.branchId === 'alt-2',
    )
    expect(s1alt2).toMatchObject({ thoughtCount: 1, agentIds: [] })
  })
})

describe('buildRepoTimeline', () => {
  it('interleaves sessions and merges in ascending time order', () => {
    const items = buildRepoTimeline(
      [
        session({ id: 's-old', createdAt: '2026-07-01T00:00:00Z' }),
        session({ id: 's-new', createdAt: '2026-07-03T00:00:00Z' }),
      ],
      [],
      [
        merge({
          id: 'm1',
          created_at: '2026-07-02T00:00:00Z',
          decided_at: '2026-07-02T12:00:00Z',
        }),
      ],
    )

    expect(items.map((i) => i.kind)).toEqual(['session', 'merge', 'session'])
    // merge sorts by decided_at when present
    expect(items[1].at).toBe('2026-07-02T12:00:00Z')
  })

  it('attaches branches to their session sorted by thought count', () => {
    const items = buildRepoTimeline(
      [session({ id: 's1' })],
      [
        { sessionId: 's1', branchId: 'small', thoughtCount: 1, agentIds: [] },
        { sessionId: 's1', branchId: 'big', thoughtCount: 9, agentIds: [] },
        { sessionId: 'other', branchId: 'x', thoughtCount: 3, agentIds: [] },
      ],
      [],
    )

    expect(items).toHaveLength(1)
    const item = items[0]
    if (item.kind !== 'session') throw new Error('expected session item')
    expect(item.branches.map((b) => b.branchId)).toEqual(['big', 'small'])
  })
})

describe('maxBranchCount', () => {
  it('returns the widest session fan-out', () => {
    const items = buildRepoTimeline(
      [session({ id: 's1' }), session({ id: 's2', createdAt: '2026-07-02T00:00:00Z' })],
      [
        { sessionId: 's1', branchId: 'a', thoughtCount: 1, agentIds: [] },
        { sessionId: 's2', branchId: 'b', thoughtCount: 1, agentIds: [] },
        { sessionId: 's2', branchId: 'c', thoughtCount: 1, agentIds: [] },
      ],
      [],
    )
    expect(maxBranchCount(items)).toBe(2)
  })
})
