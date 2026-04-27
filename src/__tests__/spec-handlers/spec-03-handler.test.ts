/**
 * Spec 03 — Mid-Session Recall Primitives: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V3.1: `getThought` in-bounds returns thought; out-of-bounds returns `null`
 * - V3.2: `recentThoughts` ordering oldest-to-newest within slice
 * - V3.3: `searchWithin` ordering newest-to-oldest (intentionally opposite)
 * - V3.4: `searchWithin` filter by `thoughtTypes` works
 * - V3.5: `searchWithin` `limit: 1000` clamped to 100
 * - V3.8: Cross-session leakage is impossible
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
    console.warn('⚠️  Supabase not available — V3.* tests will be skipped');
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
      email: `spec-03-${Date.now()}@test.local`,
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
      name: 'spec-03-test',
      slug: `spec-03-${Date.now()}`,
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

// ---------------------------------------------------------------------------
// V3.1: getThought in-bounds returns thought; out-of-bounds returns null
// ---------------------------------------------------------------------------

describe('V3.1 — getThought in-bounds and out-of-bounds behavior', () => {
  it.skipIf(!ctx.available)('getThought returns thought for valid thought_number', async () => {
    /**
     * Check: in-bounds returns the thought; out-of-bounds returns `null`, never throws.
     *
     * Pass: `getThought(sessionId, 5)` returns the thought,
     * `getThought(sessionId, 99)` returns `null`.
     */

    const sessionId = await createSession('V3.1 test session');

    try {
      // Submit a thought with explicit number
      await submitThought(sessionId, 'V3.1 test thought', 'reasoning', 5);

      // Fetch via RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_thought_number: 5,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_get_thought RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      expect(result).toBeTruthy();
      expect(result.thought).toBe('V3.1 test thought');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('getThought returns null for out-of-bounds thought_number', async () => {
    /**
     * Check: out-of-bounds returns `null`, never throws.
     */

    const sessionId = await createSession('V3.1 out-of-bounds test');

    try {
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_thought_number: 99,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_get_thought RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      // Should return null for non-existent thought
      expect(result).toBeNull();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.2: recentThoughts ordering oldest-to-newest within slice
// ---------------------------------------------------------------------------

describe('V3.2 — recentThoughts ordering oldest-to-newest', () => {
  it.skipIf(!ctx.available)('recentThoughts returns thoughts in oldest-to-newest order', async () => {
    /**
     * Check: ordering is oldest-to-newest within slice.
     *
     * Pass: write thoughts 1..20, `recentThoughts(5)` returns `thought_number`
     * array `[16,17,18,19,20]` in that order.
     */

    const sessionId = await createSession('V3.2 test session');

    try {
      // Submit 20 thoughts
      for (let i = 1; i <= 20; i++) {
        await submitThought(sessionId, `Thought ${i}`, 'reasoning', i);
      }

      // Fetch recent 5 thoughts
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_recent_thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_limit: 5,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_recent_thoughts RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      expect(result.thoughts).toHaveLength(5);

      // Should return [16, 17, 18, 19, 20] - the 5 most recent, in oldest-to-newest order
      const thoughtNumbers = result.thoughts.map((t: { thought_number: number }) => t.thought_number);
      expect(thoughtNumbers).toEqual([16, 17, 18, 19, 20]);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.3: searchWithin ordering newest-to-oldest
// ---------------------------------------------------------------------------

describe('V3.3 — searchWithin ordering newest-to-oldest', () => {
  it.skipIf(!ctx.available)('searchWithin returns thoughts in newest-to-oldest order', async () => {
    /**
     * Check: ordering is newest-to-oldest (intentionally opposite of recentThoughts).
     *
     * Pass: seed thoughts 1..20 each containing word `foo` only at positions 5, 12, 18;
     * `searchWithin('foo')` returns `[18, 12, 5]`.
     */

    const sessionId = await createSession('V3.3 test session');

    try {
      // Submit 20 thoughts, only some contain 'foo'
      for (let i = 1; i <= 20; i++) {
        const content = i === 5 || i === 12 || i === 18 ? `Thought ${i} contains foo here` : `Thought ${i} no match`;
        await submitThought(sessionId, content, 'reasoning', i);
      }

      // Search for 'foo'
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_search_within`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_query: 'foo',
        }),
      });

      if (!res.ok) {
        throw new Error(`session_search_within RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      // Should return newest-to-oldest: [18, 12, 5]
      const thoughtNumbers = result.thoughts.map((t: { thought_number: number }) => t.thought_number);
      expect(thoughtNumbers).toEqual([18, 12, 5]);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.4: searchWithin filter by thoughtTypes
// ---------------------------------------------------------------------------

describe('V3.4 — searchWithin filter by thoughtTypes', () => {
  it.skipIf(!ctx.available)('searchWithin only returns matching thoughtTypes', async () => {
    /**
     * Check: `thoughtTypes:['decision_frame']` only matches that type.
     *
     * Pass: out of 20 mixed-type thoughts, only the decision_frame rows return.
     */

    const sessionId = await createSession('V3.4 test session');

    try {
      // Submit mixed-type thoughts
      for (let i = 1; i <= 20; i++) {
        const type = i % 4 === 0 ? 'decision_frame' : 'reasoning';
        await submitThought(sessionId, `Thought ${i}`, type, i);
      }

      // Search with thoughtTypes filter
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_search_within`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_query: 'Thought',
          p_thought_types: ['decision_frame'],
        }),
      });

      if (!res.ok) {
        throw new Error(`session_search_within RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      // Should only return decision_frame thoughts
      for (const t of result.thoughts) {
        expect(t.thought_type).toBe('decision_frame');
      }
      // Should have 5 decision_frame thoughts (20 / 4 = 5)
      expect(result.thoughts.length).toBe(5);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.5: searchWithin limit clamp to 100
// ---------------------------------------------------------------------------

describe('V3.5 — searchWithin limit clamp', () => {
  it.skipIf(!ctx.available)('searchWithin clamps limit: 1000 to 100', async () => {
    /**
     * Check: `limit: 1000` is clamped to 100 server-side.
     *
     * Pass: query returning 200 candidates returns 100 rows.
     */

    const sessionId = await createSession('V3.5 test session');

    try {
      // Submit 200 thoughts all containing 'foo'
      for (let i = 1; i <= 200; i++) {
        await submitThought(sessionId, `Thought ${i} foo`, 'reasoning', i);
      }

      // Search with limit: 1000 (should be clamped to 100)
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_search_within`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_query: 'foo',
          p_limit: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_search_within RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      // Should be clamped to 100
      expect(result.thoughts.length).toBeLessThanOrEqual(100);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V3.8: Cross-session leakage is impossible
// ---------------------------------------------------------------------------

describe('V3.8 — Cross-session leakage is impossible', () => {
  it.skipIf(!ctx.available)('searchWithin only returns thoughts from the specified session', async () => {
    /**
     * Check: cross-session leakage is impossible.
     *
     * Pass: insert "foo" thought into session A and B;
     * `searchWithin` invoked with session A's id returns 1 row, not 2.
     */

    const sessionA = await createSession('V3.8 session A');
    const sessionB = await createSession('V3.8 session B');

    try {
      // Submit 'foo' thought to session A
      await submitThought(sessionA, 'Thought with foo in A', 'reasoning', 1);

      // Submit 'foo' thought to session B
      await submitThought(sessionB, 'Thought with foo in B', 'reasoning', 1);

      // Search in session A only
      const resA = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_search_within`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionA,
          p_query: 'foo',
        }),
      });

      if (!resA.ok) {
        throw new Error(`session_search_within RPC failed: ${resA.status} ${await resA.text()}`);
      }

      const resultA = await resA.json();
      expect(resultA.thoughts.length).toBe(1);
      expect(resultA.thoughts[0].session_id).toBe(sessionA);

      // Search in session B only
      const resB = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_search_within`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionB,
          p_query: 'foo',
        }),
      });

      const resultB = await resB.json();
      expect(resultB.thoughts.length).toBe(1);
      expect(resultB.thoughts[0].session_id).toBe(sessionB);
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
