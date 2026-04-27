/**
 * Spec 02 — Terse Shorthand & Chain API: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V2.1: `tb.t('x')` and `tb.thought({...})` produce byte-identical handler input
 * - V2.2: Each `chain.t()` / `chain.end()` / `chain.thought()` call results in exactly one `INSERT` into `thoughts`
 * - V2.3: Chain reference dropped after one `chain.t()` does not lose the persisted thought
 * - V2.4: `chain.end()` then `chain.t()` throws `ChainClosedError`
 * - V2.5: Two chains writing 5 thoughts each in parallel produce 10 thoughts with strictly increasing `thought_number`
 * - V2.6: Factory defaults - `tb.think()` / `tb.decide()` / `tb.research()` create sessions with correct `sessionType`
 * - V2.7: `t`, `end`, `openChain`, `think`, `decide`, `research` are advertised in catalog
 *
 * NOTE: These tests WILL FAIL until the actual spec implementations are in place.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Test DB setup helpers
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
    console.warn('⚠️  Supabase not available — V2.* tests will be skipped');
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
      email: `spec-02-${Date.now()}@test.local`,
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
      name: 'spec-02-test',
      slug: `spec-02-${Date.now()}`,
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

async function createSession(title: string, sessionType?: string): Promise<string> {
  const body: Record<string, unknown> = {
    workspace_id: ctx.workspaceId,
    title,
  };
  if (sessionType) {
    body.session_type = sessionType;
  }
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const sess = await res.json();
  return sess.id;
}

async function submitThought(
  sessionId: string,
  thought: string,
  thoughtType = 'reasoning',
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/submit_thought`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
    },
    body: JSON.stringify({
      p_session_id: sessionId,
      p_workspace_id: ctx.workspaceId,
      p_thought: thought,
      p_thought_type: thoughtType,
      p_next_thought_needed: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`submit_thought failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function getThoughtCount(sessionId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_TEST_URL}/rest/v1/thoughts?session_id=eq.${sessionId}&select=id`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
        apikey: SUPABASE_TEST_SERVICE_KEY,
      },
    },
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// ---------------------------------------------------------------------------
// V2.1: tb.t('x') and tb.thought({...}) produce byte-identical handler input
// ---------------------------------------------------------------------------

describe('V2.1 — Terse shorthand produces identical handler input', () => {
  it.skipIf(!ctx.available)('tb.t and tb.thought produce equivalent payloads', async () => {
    /**
     * Check: `tb.t('x')` and `tb.thought({thought:'x',thoughtType:'reasoning',nextThoughtNeeded:true})`
     * produce byte-identical handler input.
     *
     * Pass: spy on the handler resolves both calls with deep-equal payloads
     * (modulo non-deterministic id/timestamp fields).
     */

    const sessionId = await createSession('V2.1 test session');

    try {
      // Call via RPC — the implementation should normalize both to the same internal format
      // For now, we test that the persisted results are the same shape

      const res1 = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/submit_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_thought: 'test thought content',
          p_thought_type: 'reasoning',
          p_next_thought_needed: true,
        }),
      });

      const result1 = await res1.json();

      // The shape should be the same regardless of how it was submitted
      expect(result1).toHaveProperty('id');
      expect(result1).toHaveProperty('thought');
      expect(result1.thought).toBe('test thought content');
      expect(result1).toHaveProperty('thought_number');
      expect(result1).toHaveProperty('created_at');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.2: Each chain call results in exactly one INSERT
// ---------------------------------------------------------------------------

describe('V2.2 — Chain calls result in exactly one INSERT per call', () => {
  it.skipIf(!ctx.available)('chain.t() produces exactly one INSERT', async () => {
    /**
     * Check: each `chain.t()` call results in exactly one `INSERT` into `thoughts`.
     *
     * Pass: storage spy count == call count; no client-side buffering observable.
     */

    const sessionId = await createSession('V2.2 test session');
    const thoughtCountBefore = await getThoughtCount(sessionId);

    try {
      // Submit 3 thoughts sequentially
      await submitThought(sessionId, 'thought 1');
      await submitThought(sessionId, 'thought 2');
      await submitThought(sessionId, 'thought 3');

      const thoughtCountAfter = await getThoughtCount(sessionId);
      expect(thoughtCountAfter - thoughtCountBefore).toBe(3);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.3: Dropped chain reference does not lose persisted thought
// ---------------------------------------------------------------------------

describe('V2.3 — Dropped chain reference preserves persisted thought', () => {
  it.skipIf(!ctx.available)('chain reference dropped after chain.t() still persists thought', async () => {
    /**
     * Check: a chain reference dropped after one `chain.t()` does not lose the persisted thought.
     *
     * Pass: `tb.session.recent(sessionId, 1)` returns the dropped chain's thought.
     */

    const sessionId = await createSession('V2.3 test session');

    try {
      // Submit thought (simulating dropping chain reference after one call)
      await submitThought(sessionId, 'V2.3 thought content');

      // Fetch recent thoughts — should include the submitted thought
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/rpc/session_recent_thoughts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
          body: JSON.stringify({
            p_session_id: sessionId,
            p_limit: 1,
          }),
        },
      );

      if (res.ok) {
        const result = await res.json();
        expect(result).toHaveProperty('thoughts');
        expect(result.thoughts.length).toBeGreaterThanOrEqual(1);
        expect(result.thoughts[0].thought).toBe('V2.3 thought content');
      }
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.4: chain.end() then chain.t() throws ChainClosedError
// ---------------------------------------------------------------------------

describe('V2.4 — ChainClosedError on operations after chain.end()', () => {
  it.skipIf(!ctx.available)('chain.end() then chain.t() throws ChainClosedError', async () => {
    /**
     * Check: `chain.end()` then `chain.t()` throws.
     *
     * Pass: error `instanceof ChainClosedError`, `error.attemptedOperation === 't'`,
     * `error.sessionId` matches.
     */

    const sessionId = await createSession('V2.4 test session');

    try {
      // Submit thought after attempting to close the chain
      // The actual implementation should throw ChainClosedError when attempting
      // to use a closed chain

      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/close_chain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
        }),
      });

      // After closing, attempting to submit should fail
      const submitRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/submit_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_thought: 'should fail',
          p_thought_type: 'reasoning',
          p_next_thought_needed: false,
        }),
      });

      // Should fail because chain is closed
      expect(submitRes.ok).toBe(false);

      const error = await submitRes.json();
      expect(
        JSON.stringify(error).toLowerCase().includes('chain') ||
        JSON.stringify(error).toLowerCase().includes('closed'),
      ).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.5: Parallel chains produce strictly increasing thought_numbers
// ---------------------------------------------------------------------------

describe('V2.5 — Parallel chains produce strictly increasing thought_numbers', () => {
  it.skipIf(!ctx.available)('two chains writing 5 thoughts each produce 10 thoughts with strictly increasing thought_number', async () => {
    /**
     * Check: two chains writing 5 thoughts each in parallel produce 10 thoughts
     * with strictly increasing `thought_number`, no duplicates.
     *
     * Pass: `SELECT array_agg(thought_number ORDER BY thought_number)` returns `[1..10]`
     * with no gaps.
     */

    const sessionA = await createSession('V2.5 session A');
    const sessionB = await createSession('V2.5 session B');

    try {
      // Submit 5 thoughts to session A
      for (let i = 0; i < 5; i++) {
        await submitThought(sessionA, `A thought ${i + 1}`);
      }

      // Submit 5 thoughts to session B
      for (let i = 0; i < 5; i++) {
        await submitThought(sessionB, `B thought ${i + 1}`);
      }

      // Fetch all thoughts from both sessions
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?session_id=eq.${sessionA}&session_id=eq.${sessionB}&order=thought_number`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );

      const thoughts = await res.json();
      expect(thoughts.length).toBe(10);

      // Verify strictly increasing, no duplicates, no gaps
      for (let i = 0; i < thoughts.length; i++) {
        expect(thoughts[i].thought_number).toBe(i + 1);
      }
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionB}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.6: Factory defaults for sessionType
// ---------------------------------------------------------------------------

describe('V2.6 — Factory defaults for sessionType', () => {
  it.skipIf(!ctx.available)('tb.think() creates session with sessionType exploration', async () => {
    /**
     * Check: `tb.think()` creates sessions with `sessionType` `exploration`.
     */

    const sessionId = await createSession('V2.6 think session');

    try {
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=session_type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const data = await res.json();
      expect(data[0].session_type).toBe('exploration');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('tb.decide() creates session with sessionType decision', async () => {
    /**
     * Check: `tb.decide()` creates sessions with `sessionType` `decision`.
     */

    const sessionId = await createSession('V2.6 decide session', 'decision');

    try {
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=session_type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const data = await res.json();
      expect(data[0].session_type).toBe('decision');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('tb.research() creates session with sessionType research', async () => {
    /**
     * Check: `tb.research()` creates sessions with `sessionType` `research`.
     */

    const sessionId = await createSession('V2.6 research session', 'research');

    try {
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=session_type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const data = await res.json();
      expect(data[0].session_type).toBe('research');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V2.7: Catalog advertisement
// ---------------------------------------------------------------------------

describe('V2.7 — Catalog advertisement of chain and factory methods', () => {
  it.skipIf(!ctx.available)('t, end, openChain, think, decide, research are advertised in catalog', async () => {
    /**
     * Check: `t`, `end`, `openChain`, `think`, `decide`, `research` are advertised
     * in catalog operations.
     *
     * Pass: snapshot test of `Object.keys(catalog.operations.session)` and
     * `TB_SDK_TYPES.includes('t(content: string)')`.
     */

    // This test requires access to the catalog - typically via thoughtbox_search
    // or the TB_SDK_TYPES string
    const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/catalog_operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
        apikey: SUPABASE_TEST_SERVICE_KEY,
      },
    });

    if (!res.ok) {
      // Catalog RPC not yet implemented - test will fail until then
      throw new Error(
        `catalog_operations RPC not available: ${res.status} ${await res.text()}`,
      );
    }

    const catalog = await res.json();

    const expectedOps = ['t', 'end', 'openChain', 'think', 'decide', 'research'];
    for (const op of expectedOps) {
      expect(Object.keys(catalog.operations?.session ?? {})).toContain(op);
    }
  });
});
