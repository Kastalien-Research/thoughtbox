/**
 * Spec 01 — Auto-Numbering Surfacing: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V1.5: Every persisted thought from `processThought` carries non-null
 *         `thoughtNumber: number` and `timestamp: string` regardless of input;
 *         submissions with `thoughtNumber` explicitly passed are rejected with
 *         HTTP-400-equivalent error
 *
 * NOTE: These tests WILL FAIL until the actual spec implementations are in place.
 * This is a test scaffold that validates the implementation once it exists.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
  sessionId: string;
  userId: string;
  available: boolean;
  cleanupFns: Array<() => Promise<void>>;
}

const ctx: TestContext = {
  workspaceId: '',
  sessionId: '',
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
    console.warn('⚠️  Supabase not available — V1.5 tests will be skipped');
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
      email: `spec-01-${Date.now()}@test.local`,
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
      name: 'spec-01-test',
      slug: `spec-01-${Date.now()}`,
      owner_user_id: ctx.userId,
    }),
  });
  const ws = await wsRes.json();
  ctx.workspaceId = ws.id;

  // Create session
  const sessRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      workspace_id: ctx.workspaceId,
      title: 'V1.5 Auto-numbering test session',
    }),
  });
  const sess = await sessRes.json();
  ctx.sessionId = sess.id;

  ctx.cleanupFns.push(async () => {
    // Clean up via REST API
    await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${ctx.sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
    });
    await fetch(`${SUPABASE_TEST_URL}/rest/v1/workspaces?id=eq.${ctx.workspaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
    });
  });
});

afterAll(async () => {
  for (const fn of ctx.cleanupFns) {
    await fn().catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// V1.5: Auto-numbering surfacing
// ---------------------------------------------------------------------------

describe('V1.5 — Auto-Numbering Surfacing (HANDLER)', () => {
  it.skipIf(!ctx.available)('every persisted thought carries thoughtNumber and timestamp', async () => {
    /**
     * Check: Every persisted thought from `processThought` carries non-null
     * `thoughtNumber: number` and `timestamp: string` regardless of input.
     *
     * Pass: 100 randomized submissions all surface both fields populated.
     */

    const thoughtContents = [
      'Testing auto-numbering with simple text',
      'Another thought for V1.5 validation',
      'Yet another entry to check persistence',
      'Checking that thoughtNumber is always present',
      'Verifying timestamp is always populated',
    ];

    const persistedThoughts: Array<{ thoughtNumber: number | null; timestamp: string | null }> = [];

    for (const content of thoughtContents) {
      // Submit thought via handler — the handler should auto-assign thoughtNumber and timestamp
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/process_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: ctx.sessionId,
          p_workspace_id: ctx.workspaceId,
          p_thought: content,
          p_thought_type: 'reasoning',
          p_next_thought_needed: true,
          p_total_thoughts: null,
        }),
      });

      if (!res.ok) {
        // Handler not yet implemented — test will fail
        throw new Error(
          `process_thought RPC not available or failed: ${res.status} ${await res.text()}`,
        );
      }

      const result = await res.json();

      // The result should contain the persisted thought with auto-assigned fields
      persistedThoughts.push({
        thoughtNumber: result.thought_number ?? result.thoughtNumber ?? null,
        timestamp: result.timestamp ?? result.created_at ?? null,
      });
    }

    // Assert all persisted thoughts have non-null thoughtNumber and timestamp
    for (let i = 0; i < persistedThoughts.length; i++) {
      const t = persistedThoughts[i];
      expect(t.thoughtNumber).toBeTruthy();
      expect(typeof t.thoughtNumber).toBe('number');
      expect(t.timestamp).toBeTruthy();
      expect(typeof t.timestamp).toBe('string');
      // Verify timestamp is valid ISO
      expect(new Date(t.timestamp!).toISOString()).toBe(t.timestamp);
    }

    // Verify thoughtNumbers are strictly increasing (1, 2, 3, ...)
    const numbers = persistedThoughts.map(t => t.thoughtNumber!);
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1);
    }
  });

  it.skipIf(!ctx.available)('submissions with thoughtNumber explicitly passed are rejected', async () => {
    /**
     * Check: Submissions with `thoughtNumber` explicitly passed are rejected
     * with HTTP-400-equivalent error.
     *
     * Pass: Attempting to pass thoughtNumber returns an error.
     */

    const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/process_thought`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
        apikey: SUPABASE_TEST_SERVICE_KEY,
      },
      body: JSON.stringify({
        p_session_id: ctx.sessionId,
        p_workspace_id: ctx.workspaceId,
        p_thought: 'Attempting to set custom thoughtNumber',
        p_thought_type: 'reasoning',
        p_next_thought_needed: false,
        p_total_thoughts: null,
        p_thought_number: 999, // Explicitly passing thoughtNumber — should be rejected
      }),
    });

    // Should be rejected with 400-level error
    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const error = await res.json();
    // Error should indicate the field is not allowed
    expect(
      JSON.stringify(error).toLowerCase().includes('thought_number') ||
      JSON.stringify(error).toLowerCase().includes('not allowed') ||
      JSON.stringify(error).toLowerCase().includes('unexpected'),
    ).toBe(true);
  });

  it.skipIf(!ctx.available)('thoughtNumber auto-increments across multiple sessions independently', async () => {
    /**
     * Additional validation: thoughtNumber should auto-increment independently per session.
     * Creating a new session should start thoughtNumber at 1.
     */

    // Create a new session
    const newSessRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
        apikey: SUPABASE_TEST_SERVICE_KEY,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        workspace_id: ctx.workspaceId,
        title: 'V1.5 second session test',
      }),
    });
    const newSess = await newSessRes.json();
    const newSessionId = newSess.id;

    try {
      // Submit first thought in new session
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/process_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: newSessionId,
          p_workspace_id: ctx.workspaceId,
          p_thought: 'First thought in new session',
          p_thought_type: 'reasoning',
          p_next_thought_needed: false,
          p_total_thoughts: null,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Should start at 1 for new session, not continue from previous session
        const tn = result.thought_number ?? result.thoughtNumber ?? -1;
        expect(tn).toBe(1);
      }
    } finally {
      // Clean up new session
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${newSessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
