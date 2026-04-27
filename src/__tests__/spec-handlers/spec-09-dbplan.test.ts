/**
 * Spec 09 — Checkpoint Primitives: DB-PLAN validators
 *
 * Validators (from VALIDATORS.md):
 * - V9.4: EXPLAIN (FORMAT JSON) on checkpoint query references idx_thoughts_checkpoint;
 *         same for label-equality query
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
      email: `spec-09-dbplan-${Date.now()}@test.local`,
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
      name: 'spec-09-dbplan-test',
      slug: `spec-09-dbplan-${Date.now()}`,
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
  metadata?: Record<string, unknown>,
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
  if (metadata) {
    body.metadata = metadata;
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
  const root = (plan.Plan ?? plan) as Record<string, unknown>;
  const stack: Record<string, unknown>[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node['Index Name']) {
      names.push(node['Index Name'] as string);
    }
    if (Array.isArray(node.Plans)) {
      stack.push(...(node.Plans as Record<string, unknown>[]));
    }
  }
  return names;
}

/**
 * Obtain EXPLAIN output for a given SQL query via the pg_explain RPC.
 * Returns the plan as a parsed object or throws.
 */
async function getExplainPlan(sql: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/pg_explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
    },
    body: JSON.stringify({ p_sql: sql }),
  });

  if (!res.ok) {
    throw new Error(`pg_explain RPC failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const rawPlan = data.explain ?? data[0]?.EXPLAIN ?? data[0]?.QUERY_PLAN;

  if (typeof rawPlan === 'string') {
    // If we got text format, try to parse as JSON anyway
    try {
      return JSON.parse(rawPlan);
    } catch {
      // Return text plan wrapped in a structure
      return { textPlan: rawPlan };
    }
  }

  return rawPlan ?? {};
}

// ---------------------------------------------------------------------------
// V9.4: DB-PLAN — checkpoint queries use idx_thoughts_checkpoint
// ---------------------------------------------------------------------------

describe('V9.4 — EXPLAIN plan for checkpoint metadata ? query references idx_thoughts_checkpoint', () => {
  it.skipIf(!ctx.available)('EXPLAIN on metadata ? checkpoint plan references idx_thoughts_checkpoint', async () => {
    /**
     * Check: `EXPLAIN (FORMAT JSON)` on `WHERE session_id=$1 AND metadata ? 'checkpoint'`
     * plan references `idx_thoughts_checkpoint`.
     *
     * Pass: plan JSON (or text plan) contains idx_thoughts_checkpoint.
     */

    const sessionId = await createSession('V9.4 checkpoint dbplan test');

    try {
      // Seed a checkpoint-tagged thought
      await submitThought(sessionId, 'checkpoint thought', 'reasoning', 1, {
        checkpoint: { id: 'cp-001', label: 'init' },
      });

      const sql = `
        SELECT t.id
        FROM thoughts t
        WHERE t.session_id = '${sessionId}'
          AND t.metadata ? 'checkpoint'
        LIMIT 1
      `;

      const plan = await getExplainPlan(sql);

      // Try JSON plan first
      const indexNames = collectIndexNames(plan);
      if (indexNames.length > 0) {
        expect(indexNames).toContain('idx_thoughts_checkpoint');
        return;
      }

      // Fallback: text plan
      const textPlan = (plan.textPlan ?? JSON.stringify(plan)) as string;
      expect(textPlan).toContain('idx_thoughts_checkpoint');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('EXPLAIN on label-equality query plan references idx_thoughts_checkpoint', async () => {
    /**
     * Check: Same for label-equality query, e.g. `WHERE metadata->>'label' = 'init'`.
     *
     * Pass: plan JSON (or text plan) contains idx_thoughts_checkpoint.
     */

    const sessionId = await createSession('V9.4 label dbplan test');

    try {
      // Seed a labeled checkpoint thought
      await submitThought(sessionId, 'labeled checkpoint thought', 'reasoning', 1, {
        checkpoint: { label: 'init' },
      });

      const sql = `
        SELECT t.id
        FROM thoughts t
        WHERE t.session_id = '${sessionId}'
          AND t.metadata->>'label' = 'init'
        LIMIT 1
      `;

      const plan = await getExplainPlan(sql);

      const indexNames = collectIndexNames(plan);
      if (indexNames.length > 0) {
        expect(indexNames).toContain('idx_thoughts_checkpoint');
        return;
      }

      // Fallback: text plan
      const textPlan = (plan.textPlan ?? JSON.stringify(plan)) as string;
      expect(textPlan).toContain('idx_thoughts_checkpoint');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
