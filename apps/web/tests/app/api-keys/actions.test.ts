import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listApiKeys, revokeApiKeyAction } from '@/app/w/[workspaceSlug]/api-keys/actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockGetUser = vi.fn()

// Chainable query mock: records every method call with args, resolves with
// a configured payload when awaited (or when a terminal .single() is hit).
type Call = { method: string; args: unknown[] }

function makeQuery(result: unknown) {
  const calls: Call[] = []
  const query: Record<string, unknown> = {}
  const chain = (method: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push({ method, args })
      return query
    })
  query.select = chain('select')
  query.update = chain('update')
  query.eq = chain('eq')
  query.order = chain('order')
  query.single = vi.fn(() => {
    calls.push({ method: 'single', args: [] })
    return Promise.resolve(result)
  })
  // awaiting the builder itself (list/update paths without .single())
  query.then = (
    resolve: (value: unknown) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject)
  return { query, calls }
}

let tableResults: Record<string, ReturnType<typeof makeQuery>[]>

const mockFrom = vi.fn((table: string) => {
  const queue = tableResults[table]
  if (!queue || queue.length === 0) {
    throw new Error(`Unexpected from("${table}")`)
  }
  return queue.shift()!.query
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

function eqFilters(calls: Call[]): Record<string, unknown> {
  return Object.fromEntries(
    calls.filter((c) => c.method === 'eq').map((c) => [c.args[0], c.args[1]]),
  )
}

describe('API key actions — workspace scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tableResults = {}
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
  })

  describe('listApiKeys', () => {
    it('scopes the query to the workspace resolved from the slug', async () => {
      const workspaceQ = makeQuery({ data: { id: 'ws-123' }, error: null })
      const keysQ = makeQuery({
        data: [
          {
            id: 'key-1',
            name: 'ci',
            prefix: 'abc123',
            status: 'active',
            last_used_at: null,
            created_at: '2026-07-01T00:00:00Z',
            revoked_at: null,
          },
        ],
        error: null,
      })
      tableResults = { workspaces: [workspaceQ], api_keys: [keysQ] }

      const keys = await listApiKeys('demo')

      expect(keys).toHaveLength(1)
      expect(eqFilters(workspaceQ.calls)).toEqual({ slug: 'demo' })
      expect(eqFilters(keysQ.calls)).toEqual({ workspace_id: 'ws-123' })
    })

    it('returns empty when the workspace slug does not resolve', async () => {
      const workspaceQ = makeQuery({ data: null, error: { message: 'not found' } })
      tableResults = { workspaces: [workspaceQ] }

      const keys = await listApiKeys('nope')

      expect(keys).toEqual([])
      expect(mockFrom).not.toHaveBeenCalledWith('api_keys')
    })

    it('returns empty when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const keys = await listApiKeys('demo')

      expect(keys).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  describe('revokeApiKeyAction', () => {
    function revokeForm(fields: Record<string, string>) {
      const formData = new FormData()
      for (const [k, v] of Object.entries(fields)) formData.append(k, v)
      return formData
    }

    it('scopes the revoke update to the resolved workspace', async () => {
      const workspaceQ = makeQuery({ data: { id: 'ws-123' }, error: null })
      const updateQ = makeQuery({ error: null })
      tableResults = { workspaces: [workspaceQ], api_keys: [updateQ] }

      const result = await revokeApiKeyAction(
        null,
        revokeForm({ keyId: 'key-1', workspaceSlug: 'demo' }),
      )

      expect(result).toEqual({ success: true })
      expect(eqFilters(updateQ.calls)).toEqual({
        id: 'key-1',
        workspace_id: 'ws-123',
        status: 'active',
      })
    })

    it('rejects when workspaceSlug is missing', async () => {
      const result = await revokeApiKeyAction(null, revokeForm({ keyId: 'key-1' }))

      expect(result).toEqual({ error: 'Workspace is required.' })
      expect(mockFrom).not.toHaveBeenCalledWith('api_keys')
    })

    it('rejects when the workspace does not resolve', async () => {
      const workspaceQ = makeQuery({ data: null, error: { message: 'not found' } })
      tableResults = { workspaces: [workspaceQ] }

      const result = await revokeApiKeyAction(
        null,
        revokeForm({ keyId: 'key-1', workspaceSlug: 'other' }),
      )

      expect(result).toEqual({ error: 'Workspace not found.' })
      expect(mockFrom).not.toHaveBeenCalledWith('api_keys')
    })
  })
})
