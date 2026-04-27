/**
 * Spec 06 — Cipher Mode Toggle: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V6.2: `cipherMode='off'` + `cipher:true` persists with `metadata.cipherDecision = {decision:'skip', reason:'mode_off'}`
 * - V6.3: Default mode is `auto`
 * - V6.5: `cipherMode='off'` + `cipher:true` returns 200 (not an error)
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
    console.warn('⚠️  Supabase not available — V6.* tests will be skipped');
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
      email: `spec-06-${Date.now()}@test.local`,
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
      name: 'spec-06-test',
      slug: `spec-06-${Date.now()}`,
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

async function createSession(title: string, cipherMode?: string): Promise<string> {
  const body: Record<string, unknown> = {
    workspace_id: ctx.workspaceId,
    title,
  };
  if (cipherMode) {
    body.cipher_mode = cipherMode;
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
  cipher?: boolean,
): Promise<{ response: Response; result?: unknown }> {
  const body: Record<string, unknown> = {
    session_id: sessionId,
    workspace_id: ctx.workspaceId,
    thought,
    thought_type: 'reasoning',
    next_thought_needed: false,
    total_thoughts: null,
  };
  if (cipher !== undefined) {
    body.cipher = cipher;
  }

  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/submit_thought`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
    },
    body: JSON.stringify(body),
  });

  const result = res.ok ? await res.json() : await res.text();
  return { response: res, result };
}

// ---------------------------------------------------------------------------
// V6.2: cipherMode='off' + cipher:true persists with cipherDecision metadata
// ---------------------------------------------------------------------------

describe('V6.2 — Cipher mode off with cipher:true persists cipherDecision metadata', () => {
  it.skipIf(!ctx.available)('persists with metadata.cipherDecision = {decision:"skip", reason:"mode_off"}', async () => {
    /**
     * Check: `cipherMode='off'` + `cipher:true` payload persists with
     * `metadata.cipherDecision = {decision:'skip', reason:'mode_off'}`.
     *
     * Pass: SQL select on the resulting row.
     */

    const sessionId = await createSession('V6.2 test', 'off');

    try {
      const { response, result } = await submitThought(sessionId, 'V6.2 cipher test', true);

      if (!response.ok) {
        throw new Error(`submit_thought failed: ${response.status} ${result}`);
      }

      // Get the thought that was created
      const thoughtId = (result as { id?: string }).id;
      expect(thoughtId).toBeTruthy();

      // Fetch the thought and verify metadata
      const thoughtRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?id=eq.${thoughtId}&select=metadata`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thought = await thoughtRes.json();
      const metadata = thought[0].metadata;

      // Verify cipherDecision is set correctly
      expect(metadata.cipherDecision).toBeTruthy();
      expect(metadata.cipherDecision.decision).toBe('skip');
      expect(metadata.cipherDecision.reason).toBe('mode_off');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V6.3: Default mode is auto
// ---------------------------------------------------------------------------

describe('V6.3 — Default cipher mode is auto', () => {
  it.skipIf(!ctx.available)('tb.session.create() with no cipherMode produces cipher_mode=auto', async () => {
    /**
     * Check: `tb.session.create()` with no `cipherMode` produces `cipher_mode='auto'`.
     *
     * Pass: column value asserted.
     */

    const sessionId = await createSession('V6.3 default mode test');

    try {
      const res = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=cipher_mode`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const data = await res.json();
      expect(data[0].cipher_mode).toBe('auto');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V6.5: Cipher contradiction is non-throwing (returns 200)
// ---------------------------------------------------------------------------

describe('V6.5 — Cipher contradiction is silently ignored, not an error', () => {
  it.skipIf(!ctx.available)('cipherMode=off + cipher:true returns 200, not an error', async () => {
    /**
     * Check: spec explicitly says flag-vs-mode contradiction is **silently ignored, not an error**.
     *
     * Pass: `cipherMode='off'` + `cipher:true` returns 200; structured log line at `debug`
     * level recording the ignore; *not* an error response.
     */

    const sessionId = await createSession('V6.5 contradiction test', 'off');

    try {
      const { response } = await submitThought(sessionId, 'V6.5 should not error', true);

      // Should return 200, not an error
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('cipherMode=off + cipher:true does not throw', async () => {
    /**
     * Additional check: the RPC should not throw an exception.
     */

    const sessionId = await createSession('V6.5 no-throw test', 'off');

    try {
      // This should not throw
      const { response } = await submitThought(sessionId, 'V6.5 no throw', true);

      // If it got a response (even error), it didn't throw
      expect(response).toBeTruthy();
      expect(response.status).toBe(200);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
