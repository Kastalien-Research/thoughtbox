/**
 * POST /api/merge/[id]/approve tests (SPEC-MERGE-EVIDENCE c4/c5/c6):
 * the ONLY approval surface. Human session + owner role required; CAS
 * guard makes blocked/approved records immutable (409, no write);
 * approving a merge with base_ref "merge:<id>" supersedes that commit.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeSupabase, makeMergeRow, type FakeSupabase } from './helpers'

let supabase: FakeSupabase

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabase),
}))

import { POST } from '@/app/api/merge/[id]/approve/route'

function approve(id = 'merge-1') {
  const request = new NextRequest(
    new URL(`http://localhost:3000/api/merge/${id}/approve`),
    { method: 'POST' },
  )
  return POST(request, { params: Promise.resolve({ id }) })
}

describe('POST /api/merge/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('401 when unauthenticated', async () => {
    supabase = createFakeSupabase({ user: null })
    const response = await approve()
    expect(response.status).toBe(401)
  })

  it('404 when the merge commit does not exist', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: { merge_commits: [{ data: null, error: null }] },
    })
    const response = await approve('merge-ghost')
    expect(response.status).toBe(404)
  })

  it('404 for non-members (no existence leak)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [{ data: makeMergeRow(), error: null }],
        workspace_memberships: [{ data: null, error: null }],
      },
    })
    const response = await approve()
    expect(response.status).toBe(404)
  })

  it('403 for members who are not the workspace owner (human-only, owner-only)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [{ data: makeMergeRow(), error: null }],
        workspace_memberships: [{ data: { role: 'member' }, error: null }],
      },
    })
    const response = await approve()
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toContain('owner')
  })

  it('409 when approving a blocked merge (terminal, immutable)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [
          { data: makeMergeRow({ status: 'blocked' }), error: null },
          { data: [], error: null }, // CAS update matches zero rows
        ],
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
      },
    })
    const response = await approve()
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.status).toBe('blocked')
    expect(body.error).toContain('immutable')
  })

  it('409 when re-approving an approved merge (double-approve)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [
          { data: makeMergeRow({ status: 'approved', approved_by: 'user-0' }), error: null },
          { data: [], error: null },
        ],
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
      },
    })
    const response = await approve()
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.status).toBe('approved')
  })

  it('200 approves a pending merge via status-guarded CAS', async () => {
    const approvedRow = makeMergeRow({
      status: 'approved',
      approved_by: 'user-1',
      decided_at: '2026-07-06T02:00:00.000Z',
    })
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [
          { data: makeMergeRow(), error: null },
          { data: [approvedRow], error: null },
        ],
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
      },
    })
    const response = await approve()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.merge.status).toBe('approved')
    expect(body.merge.approved_by).toBe('user-1')
    expect(body.superseded).toBeNull()

    const updateBuilder = supabase.builders.merge_commits![1]!
    const updateCall = updateBuilder.calls.find(([name]) => name === 'update')!
    expect(updateCall[1]).toMatchObject({ status: 'approved', approved_by: 'user-1' })
    expect((updateCall[1] as { decided_at: string }).decided_at).toEqual(expect.any(String))
    // The CAS guard: only pending_approval rows may flip to approved.
    expect(updateBuilder.calls).toContainEqual(['eq', 'status', 'pending_approval'])
  })

  it('200 supersedes the prior approved merge referenced by base_ref merge:<id>', async () => {
    const approvedRow = makeMergeRow({
      id: 'merge-2',
      base_ref: 'merge:merge-1',
      status: 'approved',
      approved_by: 'user-1',
    })
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [
          { data: makeMergeRow({ id: 'merge-2', base_ref: 'merge:merge-1' }), error: null },
          { data: [approvedRow], error: null },
          { data: [{ id: 'merge-1' }], error: null }, // supersession CAS hit
        ],
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
      },
    })
    const response = await approve('merge-2')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.superseded).toBe('merge-1')

    const supersedeBuilder = supabase.builders.merge_commits![2]!
    const updateCall = supersedeBuilder.calls.find(([name]) => name === 'update')!
    expect(updateCall[1]).toEqual({ status: 'superseded', superseded_by: 'merge-2' })
    // Only a still-approved prior commit is superseded (best-effort CAS).
    expect(supersedeBuilder.calls).toContainEqual(['eq', 'status', 'approved'])
    expect(supersedeBuilder.calls).toContainEqual(['eq', 'id', 'merge-1'])
  })

  it('200 with superseded=null when the prior commit is no longer approved', async () => {
    const approvedRow = makeMergeRow({
      id: 'merge-2',
      base_ref: 'merge:merge-1',
      status: 'approved',
    })
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        merge_commits: [
          { data: makeMergeRow({ id: 'merge-2', base_ref: 'merge:merge-1' }), error: null },
          { data: [approvedRow], error: null },
          { data: [], error: null }, // supersession CAS misses
        ],
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
      },
    })
    const response = await approve('merge-2')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.superseded).toBeNull()
  })
})
