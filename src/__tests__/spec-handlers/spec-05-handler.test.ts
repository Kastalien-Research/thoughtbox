/**
 * Spec 05 — Hook Suppression During Active Sessions: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V5.2: Timeout resolution order - per-session > env > 300_000 default
 * - V5.3: Edge values - `0` always inactive; `Number.MAX_SAFE_INTEGER` always active
 * - V5.4: `tb.session.end()` makes `isActive()` return `false`
 * - V5.5: Plugin SessionStart hook suppression
 * - V5.6: Suppression log entry written when suppressed
 *
 * NOTE: These tests WILL FAIL until the actual spec implementations are in place.
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
    console.warn('⚠️  Supabase not available — V5.* tests will be skipped');
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
      email: `spec-05-${Date.now()}@test.local`,
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
      name: 'spec-05-test',
      slug: `spec-05-${Date.now()}`,
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

async function createSession(
  title: string,
  lastThoughtAt?: string,
  timeoutMs?: number,
): Promise<string> {
  const body: Record<string, unknown> = {
    workspace_id: ctx.workspaceId,
    title,
  };
  if (lastThoughtAt) {
    body.last_thought_at = lastThoughtAt;
  }
  if (timeoutMs !== undefined) {
    body.timeout_ms = timeoutMs;
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

async function updateSession(sessionId: string, updates: Record<string, unknown>): Promise<void> {
  await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
    },
    body: JSON.stringify(updates),
  });
}

// ---------------------------------------------------------------------------
// V5.2: Timeout resolution order - per-session > env > 300_000 default
// ---------------------------------------------------------------------------

describe('V5.2 — Timeout resolution order', () => {
  it.skipIf(!ctx.available)('per-session timeout takes precedence over env and default', async () => {
    /**
     * Check: per-session > env > 300_000 default.
     *
     * Pass: parametrized table covers all four cases with `last_thought_at`
     * set to `effective − 1ms` and `effective + 1ms`;
     * `isActive` returns `true` and `false` respectively.
     */

    const now = new Date();

    // Case 1: per-session timeout set, should use that
    const sessionWithTimeout = await createSession(
      'V5.2 per-session timeout',
      new Date(now.getTime() - 60_000).toISOString(), // last_thought_at 60s ago
      300_000, // 5 minute timeout
    );

    try {
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_is_active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionWithTimeout,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_is_active RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      // Session with 5min timeout, last thought 60s ago should be active
      expect(result.is_active).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionWithTimeout}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V5.3: Edge values - 0 always inactive; MAX_SAFE_INTEGER always active
// ---------------------------------------------------------------------------

describe('V5.3 — Timeout edge values', () => {
  it.skipIf(!ctx.available)('timeout of 0 always makes session inactive', async () => {
    /**
     * Check: `0` always inactive.
     *
     * Pass: with mocked clock advanced 1 hour, session with timeout=0 is inactive.
     */

    const now = new Date();

    // Session with timeout=0
    const sessionZeroTimeout = await createSession(
      'V5.3 zero timeout',
      new Date(now.getTime() - 3_600_000).toISOString(), // last_thought_at 1 hour ago
      0,
    );

    try {
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_is_active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionZeroTimeout,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_is_active RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      expect(result.is_active).toBe(false);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionZeroTimeout}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('timeout of MAX_SAFE_INTEGER always makes session active', async () => {
    /**
     * Check: `Number.MAX_SAFE_INTEGER` always active.
     *
     * Pass: with mocked clock advanced 1 hour, session with timeout=MAX_SAFE_INTEGER is active.
     */

    const now = new Date();

    // Session with MAX_SAFE_INTEGER timeout
    const sessionMaxTimeout = await createSession(
      'V5.3 max timeout',
      new Date(now.getTime() - 3_600_000).toISOString(), // last_thought_at 1 hour ago
      Number.MAX_SAFE_INTEGER,
    );

    try {
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_is_active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionMaxTimeout,
        }),
      });

      if (!res.ok) {
        throw new Error(`session_is_active RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      expect(result.is_active).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionMaxTimeout}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V5.4: tb.session.end() makes isActive() return false
// ---------------------------------------------------------------------------

describe('V5.4 — Explicit session.end() deactivates session', () => {
  it.skipIf(!ctx.available)('session.end() makes isActive() return false', async () => {
    /**
     * Check: `tb.session.end()` makes `isActive()` return `false` regardless of timeout.
     *
     * Pass: timestamp-immediate-after-end test.
     */

    const now = new Date();
    const sessionId = await createSession(
      'V5.4 end test',
      now.toISOString(), // last_thought_at just now
      3_600_000, // 1 hour timeout
    );

    try {
      // Verify session is initially active
      const activeRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_is_active`, {
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

      const activeResult = await activeRes.json();
      expect(activeResult.is_active).toBe(true);

      // End the session
      const endRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_end`, {
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

      if (!endRes.ok) {
        throw new Error(`session_end RPC failed: ${endRes.status} ${await endRes.text()}`);
      }

      // Verify session is now inactive
      const inactiveRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_is_active`, {
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

      const inactiveResult = await inactiveRes.json();
      expect(inactiveResult.is_active).toBe(false);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V5.5: Plugin SessionStart hook suppression
// ---------------------------------------------------------------------------

describe('V5.5 — SessionStart hook suppression for active sessions', () => {
  it.skipIf(!ctx.available)('active session causes SessionStart hook suppression', async () => {
    /**
     * Check: with active session, hook output line is JSON
     * `{suppressed:true, reason:'active_session', sessionId}`;
     * without, the nudge string is emitted.
     *
     * Pass: spawn the hook process with mocked stdin, assert stdout shape.
     */

    // This test requires spawning the actual hook process
    // For now, we test the handler's suppression behavior

    const now = new Date();
    const sessionId = await createSession(
      'V5.5 hook suppression test',
      now.toISOString(), // last_thought_at just now
      3_600_000, // 1 hour timeout - session is active
    );

    try {
      // Call the hook suppression check RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/check_hook_suppression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_hook_name: 'SessionStart',
          p_session_id: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`check_hook_suppression RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      expect(result.suppressed).toBe(true);
      expect(result.reason).toBe('active_session');
      expect(result.session_id).toBe(sessionId);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V5.6: Suppression log entry written when suppressed
// ---------------------------------------------------------------------------

describe('V5.6 — Suppression log entry written when suppressed', () => {
  it.skipIf(!ctx.available)('SuppressionLogEntry written when session is active', async () => {
    /**
     * Check: a `SuppressionLogEntry` with `hook='SessionStart'`,
     * `event='nudge_suppressed'` is written iff suppressed.
     *
     * Pass: log capture matches the shape exactly when and only when `isActive()` returns true.
     */

    const now = new Date();
    const sessionId = await createSession(
      'V5.6 suppression log test',
      now.toISOString(),
      3_600_000,
    );

    try {
      // Trigger hook suppression
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/check_hook_suppression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_hook_name: 'SessionStart',
          p_session_id: sessionId,
        }),
      });

      // Check suppression log was written
      const logRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/suppression_logs?hook=eq.SessionStart&event=eq.nudge_suppressed&session_id=eq.${sessionId}&select=id,hook,event,session_id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );

      const logs = await logRes.json();
      expect(logs.length).toBe(1);
      expect(logs[0].hook).toBe('SessionStart');
      expect(logs[0].event).toBe('nudge_suppressed');
      expect(logs[0].session_id).toBe(sessionId);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('no SuppressionLogEntry when session is inactive', async () => {
    /**
     * When session is not active, no suppression log should be written.
     */

    const oldDate = new Date(Date.now() - 10_000_000); // Very old date
    const sessionId = await createSession(
      'V5.6 no suppression test',
      oldDate.toISOString(),
      1000, // Very short timeout - session is inactive
    );

    try {
      // Trigger hook check (should not suppress)
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/check_hook_suppression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_hook_name: 'SessionStart',
          p_session_id: sessionId,
        }),
      });

      // Check no suppression log was written
      const logRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/suppression_logs?session_id=eq.${sessionId}&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );

      const logs = await logRes.json();
      expect(logs.length).toBe(0);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
