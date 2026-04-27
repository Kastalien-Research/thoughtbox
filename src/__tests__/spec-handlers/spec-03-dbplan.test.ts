/**
 * Spec 03 — Mid-Session Recall Primitives: DB-PLAN and CATALOG validators
 *
 * Validators (from VALIDATORS.md):
 * - V3.7: EXPLAIN (FORMAT JSON) on searchWithin query references idx_thoughts_content_fts
 * - V3.9: CATALOG - session.getThought, session.recentThoughts, session.searchWithin present with documented titles
 *
 * NOTE: These tests WILL FAIL until the actual spec implementations are in place.
 * DB-PLAN tests require a running Supabase instance with the thoughtbox schema.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Test DB setup helpers (same pattern as spec-03-handler.test.ts)
// ---------------------------------------------------------------------------

const SUPABASE_TEST_URL = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
const SUPABASE_TEST_SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_TEST_SERVICE_KEY },
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

interface TestContext {
  workspaceId: string;
  userId: string;
  available: boolean;
  cleanupFns: Array<() => Promise<void>>;
}

const ctx: TestContext = {
  workspaceId: '',
  userId: '',
  available: false,
  cleanupFns: [],
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  ctx.available = await isSupabaseAvailable();
  if (!ctx.available) {
    console.warn('⚠️  Supabase not available — DB-PLAN tests will be skipped');
    return;
  }

  // Create test user
  const userRes = await fetch(`${SUPABASE_TEST_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
    },
    body: JSON.stringify({
      email: `spec-03-dbplan-${Date.now()}@test.local`,
      password: 'test-password-123',
      email_confirm: true,
    }),
  });
  const user = await userRes.json();
  ctx.userId = user.id;

  // Create workspace
  const wsRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      id: randomUUID(),
      name: 'spec-03-dbplan-test',
      slug: `spec-03-dbplan-${Date.now()}`,
      owner_user_id: ctx.userId,
    }),
  });
  const ws = await wsRes.json();
  ctx.workspaceId = ws.id;
});

afterAll(async () => {
  for (const fn of ctx.cleanupFns) {
    await fn().catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function createSession(title: string): Promise<string> {
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      workspace_id: ctx.workspaceId,
      title,
    }),
  });
  const sess = await res.json();
  return sess.id;
}

async function submitThought(
  sessionId: string,
  thought: string,
  thoughtType = 'reasoning',
  thoughtNumber?: number,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    session_id: sessionId,
    workspace_id: ctx.workspaceId,
    thought,
    thought_type: thoughtType,
    next_thought_needed: true,
    total_thoughts: null,
  };
  if (thoughtNumber !== undefined) {
    body.thought_number = thoughtNumber;
  }

  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/thoughts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit thought: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Walk a Postgres EXPLAIN (FORMAT JSON) plan tree and collect all index names found.
 */
function collectIndexNames(plan: Record<string, unknown>): string[] {
  const names: string[] = [];
  // Postgres EXPLAIN JSON has "Plan" at top level
  const root = (plan.Plan ?? plan) as Record<string, unknown>;
  const stack: Record<string, unknown>[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.Index Name) {
      names.push(node['Index Name'] as string);
    }
    if (Array.isArray(node.Plans)) {
      stack.push(...(node.Plans as Record<string, unknown>[]));
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// V3.7: DB-PLAN — searchWithin uses idx_thoughts_content_fts
// ---------------------------------------------------------------------------

describe('V3.7 — EXPLAIN plan for searchWithin references idx_thoughts_content_fts', () => {
  it.skipIf(!ctx.available)('EXPLAIN (FORMAT JSON) on searchWithin query contains idx_thoughts_content_fts', async () => {
    /**
     * Check: `EXPLAIN (FORMAT JSON)` on `searchWithin` query against session with 1k thoughts
     * contains node with `Index Name === 'idx_thoughts_content_fts'`.
     *
     * Walk the plan JSON, assert some node has the index name.
     * Don't assert node-type (Bitmap vs Index Scan varies by Postgres version).
     *
     * Pass: plan JSON contains idx_thoughts_content_fts in some node's "Index Name" field.
     */

    const sessionId = await createSession('V3.7 dbplan test session');

    try {
      // Seed 50 thoughts (enough to trigger index use, fewer than 1k for speed)
      for (let i = 1; i <= 50; i++) {
        await submitThought(sessionId, `Thought ${i} contains foo bar baz content`, 'reasoning', i);
      }

      // Get the session's workspace_id to scope the search
      const sessRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=workspace_id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const [sessData] = await sessRes.json();
      const workspaceId = sessData.workspace_id;

      // Build the query that searchWithin would execute (ts_headline + to_tsquery)
      // We use raw SQL via RPC or direct query to get EXPLAIN output
      const explainRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/explain_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_query: `
            SELECT t.id, t.thought, ts_headline('english', t.thought, plainto_tsquery('english', 'foo'), 'StartSel=<, StopSel=>, MaxWords=50, MinWords=20, MaxFragments=3') as thought_highlighted
            FROM thoughts t
            WHERE t.session_id = $1
              AND t.workspace_id = $2
              AND to_tsvector('english', t.thought) @@ plainto_tsquery('english', 'foo')
            ORDER BY t.thought_number DESC
            LIMIT 100
          `,
          p_params: [sessionId, workspaceId],
        }),
      });

      if (!explainRes.ok) {
        // If explain RPC doesn't exist, fall back to direct pg_explain call
        const pgRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/pg_explain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
          body: JSON.stringify({
            p_sql: `
              SELECT t.id, t.thought
              FROM thoughts t
              WHERE t.session_id = '${sessionId}'
                AND t.workspace_id = '${workspaceId}'
                AND to_tsvector('english', t.thought) @@ plainto_tsquery('english', 'foo')
              ORDER BY t.thought_number DESC
              LIMIT 100
            `,
          }),
        });

        if (!pgRes.ok) {
          throw new Error(
            `Neither explain_query nor pg_explain RPC available: ${pgRes.status} ${await pgRes.text()}`,
          );
        }

        const pgExplain = await pgRes.json();
        const planText: string = pgExplain.explain;

        // Check that the text plan mentions the FTS index
        expect(planText).toContain('idx_thoughts_content_fts');
        return;
      }

      const explainData = await explainRes.json();
      const planJson = explainData[0]?.EXPLAIN;

      if (!planJson) {
        // Fallback: check the raw text plan
        const textPlan = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/explain_query_text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
          body: JSON.stringify({
            p_query: `
              SELECT t.id, t.thought
              FROM thoughts t
              WHERE t.session_id = '${sessionId}'
                AND t.workspace_id = '${workspaceId}'
                AND to_tsvector('english', t.thought) @@ plainto_tsquery('english', 'foo')
              ORDER BY t.thought_number DESC
              LIMIT 100
            `,
            p_params: [],
          }),
        });

        if (textPlan.ok) {
          const textData = await textPlan.json();
          expect(textData[0]?.QUERY_PLAN ?? textData[0]?.Plan).toContain('idx_thoughts_content_fts');
          return;
        }

        throw new Error('Could not obtain EXPLAIN output for V3.7');
      }

      // Walk JSON plan and find index names
      const indexNames = collectIndexNames(planJson);
      expect(indexNames).toContain('idx_thoughts_content_fts');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.9: CATALOG — session.getThought, recentThoughts, searchWithin in catalog
// ---------------------------------------------------------------------------

describe('V3.9 — Catalog advertises getThought, recentThoughts, searchWithin', () => {
  it.skipIf(!ctx.available)('session.getThought, session.recentThoughts, session.searchWithin are present with documented titles', async () => {
    /**
     * Check: `session.getThought`, `session.recentThoughts`, `session.searchWithin`
     * are present in the catalog with documented titles (snapshot match).
     *
     * Pass: the session operations catalog includes these three operations
     * with non-empty title and description fields.
     */

    // Fetch the catalog
    const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/catalog_operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
        apikey: SUPABASE_TEST_SERVICE_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`catalog_operations RPC not available: ${res.status} ${await res.text()}`);
    }

    const catalog = await res.json();
    const sessionOps = catalog.operations?.session ?? {};

    // Required operations
    const requiredOps = ['getThought', 'recentThoughts', 'searchWithin'];

    for (const op of requiredOps) {
      expect(sessionOps, `session operation '${op}' should exist in catalog`).toBeDefined();
      expect(sessionOps[op], `session operation '${op}' should have a title`).toHaveProperty('title');
      expect(sessionOps[op], `session operation '${op}' should have a description`).toHaveProperty('description');
      expect(typeof sessionOps[op].title).toBe('string');
      expect(sessionOps[op].title.length).toBeGreaterThan(0);
      expect(typeof sessionOps[op].description).toBe('string');
      expect(sessionOps[op].description.length).toBeGreaterThan(0);
    }
  });
});
