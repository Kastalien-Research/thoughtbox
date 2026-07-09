/**
 * Fake Supabase server client for merge API route tests
 * (SPEC-MERGE-CORE c4/c5). Chainable, thenable query builder with
 * per-table response queues and recorded calls for assertions.
 */

import { vi } from 'vitest'

export interface FakeResponse {
  data: unknown
  error: { message: string } | null
}

export interface FakeBuilder {
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  calls: Array<[string, ...unknown[]]>
  then: (
    resolve: (value: FakeResponse) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>
}

function createBuilder(response: FakeResponse): FakeBuilder {
  const calls: Array<[string, ...unknown[]]> = []
  const builder = {} as FakeBuilder
  const chain =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args])
      return builder
    }
  builder.calls = calls
  builder.select = vi.fn(chain('select'))
  builder.update = vi.fn(chain('update'))
  builder.eq = vi.fn(chain('eq'))
  builder.neq = vi.fn(chain('neq'))
  builder.order = vi.fn(chain('order'))
  builder.maybeSingle = vi.fn(async () => response)
  builder.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject)
  return builder
}

export interface FakeSupabase {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
  /** Builders created per table, in call order, for assertions. */
  builders: Record<string, FakeBuilder[]>
}

/**
 * Each from(table) call consumes the next queued response for that table
 * (missing queue entries resolve to { data: null, error: null }).
 */
export function createFakeSupabase(options: {
  user: { id: string } | null
  responses?: Record<string, FakeResponse[]>
}): FakeSupabase {
  const queues = new Map<string, FakeResponse[]>(
    Object.entries(options.responses ?? {}),
  )
  const builders: Record<string, FakeBuilder[]> = {}
  return {
    auth: {
      getUser: vi.fn(async () =>
        options.user
          ? { data: { user: options.user }, error: null }
          : { data: { user: null }, error: { message: 'Not authenticated' } },
      ),
    },
    from: vi.fn((table: string) => {
      const queue = queues.get(table) ?? []
      const response = queue.shift() ?? { data: null, error: null }
      const builder = createBuilder(response)
      ;(builders[table] ??= []).push(builder)
      return builder
    }),
    builders,
  }
}

export function makeMergeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'merge-1',
    workspace_id: 'hub-ws-1',
    tenant_workspace_id: 'tenant-1',
    parent_branch_ids: ['branch-a', 'branch-b'],
    base_ref: null,
    evidence_notebook_id: 'nb-1',
    evidence_hash: 'a'.repeat(64),
    verdict: { decision: 'collapse', confidence: 'low' },
    status: 'pending_approval',
    requested_by: 'agent-1',
    approved_by: null,
    created_at: '2026-07-06T00:00:00.000Z',
    decided_at: null,
    superseded_by: null,
    ...overrides,
  }
}
