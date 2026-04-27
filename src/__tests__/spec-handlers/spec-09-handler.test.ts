/**
 * Spec 09 — Named Checkpoints: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V9.3: `tb.session.checkpoint('foo','bar')` produces `progress` thought with correct metadata
 * - V9.5: `checkpointsByLabel` returns oldest-first for multiple matches
 * - V9.6: `getCheckpoint` returns oldest match, `null` for missing
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
    console.warn('⚠️  Supabase not available — V9.* tests will be skipped');
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
      email: `spec-09-${Date.now()}@test.local`,
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
      name: 'spec-09-test',
      slug: `spec-09-${Date.now()}`,
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
  thoughtType: string,
  metadata?: Record<string, unknown>,
  thoughtNumber?: number,
): Promise<string> {
  const body: Record<string, unknown> = {
    session_id: sessionId,
    workspace_id: ctx.workspaceId,
    thought,
    thought_type: thoughtType,
    next_thought_needed: false,
    total_thoughts: null,
  };
  if (metadata) {
    body.metadata = metadata;
  }
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

  const result = await res.json();
  return result.id;
}

// ---------------------------------------------------------------------------
// V9.3: checkpoint produces progress thought with correct metadata
// ---------------------------------------------------------------------------

describe('V9.3 — Persisted checkpoint shape', () => {
  it.skipIf(!ctx.available)('tb.session.checkpoint(foo, bar) produces progress thought with checkpoint metadata', async () => {
    /**
     * Check: `tb.session.checkpoint('foo','bar')` produces a `progress` thought with
     * `metadata.checkpoint = {label:'foo', summary:'bar', createdAt:<iso>}`.
     *
     * Pass: SQL `metadata->'checkpoint'` deep-equal expected;
     * `Date.parse(createdAt)` is finite.
     */

    const sessionId = await createSession('V9.3 checkpoint test');

    try {
      // Call checkpoint RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_label: 'foo',
          p_summary: 'bar',
        }),
      });

      if (!res.ok) {
        throw new Error(`session_checkpoint RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      const thoughtId = result.thought_id;

      // Fetch the thought and verify
      const thoughtRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?id=eq.${thoughtId}&select=thought_type,metadata`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thought = await thoughtRes.json();

      // Should be progress thought type
      expect(thought[0].thought_type).toBe('progress');

      // Metadata should have checkpoint with correct shape
      const checkpoint = thought[0].metadata.checkpoint;
      expect(checkpoint).toBeTruthy();
      expect(checkpoint.label).toBe('foo');
      expect(checkpoint.summary).toBe('bar');
      expect(checkpoint.createdAt).toBeTruthy();

      // createdAt should be valid ISO date
      const parsedDate = Date.parse(checkpoint.createdAt);
      expect(Number.isFinite(parsedDate)).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V9.5: checkpointsByLabel returns oldest-first for multiple matches
// ---------------------------------------------------------------------------

describe('V9.5 — checkpointsByLabel ordering', () => {
  it.skipIf(!ctx.available)('checkpointsByLabel returns oldest-first for multiple matches', async () => {
    /**
     * Check: 3 checkpoints with label `'init'` returned oldest-first.
     *
     * Pass: result `thought_number` array is monotonic ascending.
     */

    const sessionId = await createSession('V9.5 checkpoints by label test');

    try {
      // Create 3 checkpoints with same label
      await submitThought(sessionId, 'checkpoint 1', 'progress', {
        checkpoint: { label: 'init', summary: 'first', createdAt: '2024-01-01T00:00:01.000Z' },
      }, 1);

      await submitThought(sessionId, 'checkpoint 2', 'progress', {
        checkpoint: { label: 'init', summary: 'second', createdAt: '2024-01-01T00:00:02.000Z' },
      }, 2);

      await submitThought(sessionId, 'checkpoint 3', 'progress', {
        checkpoint: { label: 'init', summary: 'third', createdAt: '2024-01-01T00:00:03.000Z' },
      }, 3);

      // Call checkpointsByLabel RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_checkpoints_by_label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_label: 'init',
        }),
      });

      if (!res.ok) {
        throw new Error(`session_checkpoints_by_label RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      const thoughtNumbers = result.checkpoints.map((c: { thought_number: number }) => c.thought_number);

      // Should be oldest-first (ascending thought_numbers)
      expect(thoughtNumbers).toEqual([1, 2, 3]);
      for (let i = 1; i < thoughtNumbers.length; i++) {
        expect(thoughtNumbers[i]).toBeGreaterThan(thoughtNumbers[i - 1]);
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
// V9.6: getCheckpoint returns oldest match, null for missing
// ---------------------------------------------------------------------------

describe('V9.6 — getCheckpoint first-match and null for missing', () => {
  it.skipIf(!ctx.available)('getCheckpoint returns oldest match', async () => {
    /**
     * Check: oldest match returned, `null` for missing.
     *
     * Pass: returned row's `thought_number === MIN(thought_number)`;
     * `getCheckpoint('does-not-exist')` is `null`.
     */

    const sessionId = await createSession('V9.6 get checkpoint test');

    try {
      // Create checkpoints with same label but different thought_numbers
      await submitThought(sessionId, 'checkpoint 1', 'progress', {
        checkpoint: { label: 'milestone', summary: 'first', createdAt: '2024-01-01T00:00:01.000Z' },
      }, 1);

      await submitThought(sessionId, 'checkpoint 2', 'progress', {
        checkpoint: { label: 'milestone', summary: 'second', createdAt: '2024-01-01T00:00:02.000Z' },
      }, 2);

      await submitThought(sessionId, 'checkpoint 3', 'progress', {
        checkpoint: { label: 'milestone', summary: 'third', createdAt: '2024-01-01T00:00:03.000Z' },
      }, 3);

      // Call getCheckpoint RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_label: 'milestone',
        }),
      });

      if (!res.ok) {
        throw new Error(`session_get_checkpoint RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();

      // Should return the oldest (first) checkpoint
      expect(result).toBeTruthy();
      expect(result.thought_number).toBe(1);
      expect(result.metadata.checkpoint.label).toBe('milestone');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('getCheckpoint returns null for missing label', async () => {
    /**
     * Check: `getCheckpoint('does-not-exist')` is `null`.
     */

    const sessionId = await createSession('V9.6 missing checkpoint test');

    try {
      // Call getCheckpoint with non-existent label
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_label: 'does-not-exist',
        }),
      });

      if (!res.ok) {
        throw new Error(`session_get_checkpoint RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();

      // Should return null for missing checkpoint
      expect(result).toBeNull();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
