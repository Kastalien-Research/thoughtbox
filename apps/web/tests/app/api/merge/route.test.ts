/**
 * GET /api/merge list route tests (SPEC-MERGE-CORE): auth, workspace
 * scoping via membership, status validation, and the { merges: [...] }
 * envelope consumed by the web UI fetch layer
 * (apps/web/src/lib/merge/api.ts — workspaceId is the tenant uuid).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeSupabase, makeMergeRow, type FakeSupabase } from './helpers'

let supabase: FakeSupabase

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabase),
}))

import { GET } from '@/app/api/merge/route'

function makeRequest(query: string) {
  return new NextRequest(new URL(`http://localhost:3000/api/merge${query}`))
}

describe('GET /api/merge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('401 when unauthenticated', async () => {
    supabase = createFakeSupabase({ user: null })
    const response = await GET(makeRequest('?workspaceId=tenant-1'))
    expect(response.status).toBe(401)
  })

  it('400 when workspaceId is missing', async () => {
    supabase = createFakeSupabase({ user: { id: 'user-1' } })
    const response = await GET(makeRequest(''))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('workspaceId')
  })

  it('400 on an invalid status filter', async () => {
    supabase = createFakeSupabase({ user: { id: 'user-1' } })
    const response = await GET(makeRequest('?workspaceId=tenant-1&status=contested'))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Invalid status')
  })

  it('404 when the caller is not a member (no existence leak)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        workspace_memberships: [{ data: null, error: null }],
      },
    })
    const response = await GET(makeRequest('?workspaceId=tenant-1'))
    expect(response.status).toBe(404)
  })

  it('200 returns tenant-scoped merges in the { merges } envelope', async () => {
    const rows = [makeMergeRow(), makeMergeRow({ id: 'merge-2', status: 'blocked' })]
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        workspace_memberships: [{ data: { role: 'member' }, error: null }],
        merge_commits: [{ data: rows, error: null }],
      },
    })
    const response = await GET(makeRequest('?workspaceId=tenant-1'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.merges).toHaveLength(2)
    expect(body.merges[0].id).toBe('merge-1')

    const builder = supabase.builders.merge_commits![0]!
    expect(builder.calls).toContainEqual(['eq', 'tenant_workspace_id', 'tenant-1'])
    // Membership is checked against the requested workspaceId.
    const membership = supabase.builders.workspace_memberships![0]!
    expect(membership.calls).toContainEqual(['eq', 'workspace_id', 'tenant-1'])
    expect(membership.calls).toContainEqual(['eq', 'user_id', 'user-1'])
  })

  it('200 passes the status filter through (pending review inbox)', async () => {
    supabase = createFakeSupabase({
      user: { id: 'user-1' },
      responses: {
        workspace_memberships: [{ data: { role: 'owner' }, error: null }],
        merge_commits: [{ data: [makeMergeRow()], error: null }],
      },
    })
    const response = await GET(makeRequest('?workspaceId=tenant-1&status=pending_approval'))
    expect(response.status).toBe(200)
    const builder = supabase.builders.merge_commits![0]!
    expect(builder.calls).toContainEqual(['eq', 'status', 'pending_approval'])
  })
})
