/**
 * Spec 07 — Deliberation Without Commitment: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V7.4: `options=[]` + `decisionState='deliberating'` is valid
 * - V7.6: Backward compat - thought row with no `decisionState` and selection is read back as `committed`
 * - V7.7: `generateAuditData` produces no `decision_without_action` gap for `deliberating` decision_frame
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
    console.warn('⚠️  Supabase not available — V7.* tests will be skipped');
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
      email: `spec-07-${Date.now()}@test.local`,
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
      name: 'spec-07-test',
      slug: `spec-07-${Date.now()}`,
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

async function createSession(title: string, sessionType = 'decision'): Promise<string> {
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
      session_type: sessionType,
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
// V7.4: options=[] + decisionState='deliberating' is valid
// ---------------------------------------------------------------------------

describe('V7.4 — Deliberating decision with empty options is valid', () => {
  it.skipIf(!ctx.available)('options=[] + decisionState=deliberating persists', async () => {
    /**
     * Check: `options=[]` + `decisionState='deliberating'` is valid.
     *
     * Pass: thought persists; row exists with empty options jsonb array.
     */

    const sessionId = await createSession('V7.4 test');

    try {
      const thoughtId = await submitThought(
        sessionId,
        'V7.4 deliberating decision',
        'decision_frame',
        {
          decisionState: 'deliberating',
          options: [],
        },
      );

      // Fetch and verify
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

      expect(metadata.decisionState).toBe('deliberating');
      expect(metadata.options).toEqual([]);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V7.6: Backward compatibility for decisionState
// ---------------------------------------------------------------------------

describe('V7.6 — Backward compatibility for decisionState', () => {
  it.skipIf(!ctx.available)('thought with no decisionState but with selection is read as committed', async () => {
    /**
     * Check: a thought row with no `decisionState` and `options[0].selected===true`
     * is read back as `decisionState='committed'`;
     * with no selections, `'deliberating'`.
     *
     * Pass: insert raw row, fetch via `session.get`, assert derived field.
     */

    const sessionId = await createSession('V7.6 backward compat test');

    try {
      // Insert raw thought row without decisionState but with a selected option
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          session_id: sessionId,
          workspace_id: ctx.workspaceId,
          thought: 'V7.6 committed decision',
          thought_type: 'decision_frame',
          thought_number: 1,
          next_thought_needed: false,
          total_thoughts: null,
          metadata: {
            options: [
              { label: 'A', selected: true, reason: 'Chose A' },
              { label: 'B', selected: false },
            ],
            // No decisionState field - legacy row
          },
        }),
      });

      const thought = await res.json();
      const thoughtId = thought.id;

      // Fetch via session.get and verify derived decisionState
      const getRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_thought_number: 1,
        }),
      });

      if (!getRes.ok) {
        throw new Error(`session_get_thought RPC failed: ${getRes.status} ${await getRes.text()}`);
      }

      const result = await getRes.json();
      // Should derive decisionState as 'committed' because there's a selected option
      expect(result.derived_decision_state ?? result.metadata?.decisionState).toBe('committed');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('thought with no decisionState and no selection is read as deliberating', async () => {
    /**
     * Check: with no selections, derived decisionState is 'deliberating'.
     */

    const sessionId = await createSession('V7.6 no selection test');

    try {
      // Insert raw thought row without decisionState and no selected options
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          session_id: sessionId,
          workspace_id: ctx.workspaceId,
          thought: 'V7.6 deliberating decision',
          thought_type: 'decision_frame',
          thought_number: 1,
          next_thought_needed: false,
          total_thoughts: null,
          metadata: {
            options: [
              { label: 'A', selected: false },
              { label: 'B', selected: false },
            ],
            // No decisionState field - legacy row
          },
        }),
      });

      const thought = await res.json();
      const thoughtId = thought.id;

      // Fetch via session.get and verify derived decisionState
      const getRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/session_get_thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_thought_number: 1,
        }),
      });

      const result = await getRes.json();
      // Should derive decisionState as 'deliberating' because no option is selected
      expect(result.derived_decision_state ?? result.metadata?.decisionState).toBe('deliberating');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V7.7: generateAuditData ignores deliberating decisions
// ---------------------------------------------------------------------------

describe('V7.7 — generateAuditData ignores deliberating decisions', () => {
  it.skipIf(!ctx.available)('deliberating decision_frame does not produce decision_without_action gap', async () => {
    /**
     * Check: `generateAuditData` produces no `decision_without_action` gap for
     * a `deliberating` decision_frame.
     *
     * Pass: feed the aggregator a fixture session with one `deliberating` decision frame
     * and zero following action_reports; resulting `gaps.length === 0`.
     * Pre-spec this test would fail with one gap.
     */

    const sessionId = await createSession('V7.7 audit test');

    try {
      // Submit deliberating decision_frame
      await submitThought(
        sessionId,
        'V7.7 deliberating - not yet decided',
        'decision_frame',
        {
          decisionState: 'deliberating',
          options: [],
        },
      );

      // Run audit
      const auditRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/generate_audit_data`, {
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

      if (!auditRes.ok) {
        throw new Error(`generate_audit_data RPC failed: ${auditRes.status} ${await auditRes.text()}`);
      }

      const audit = await auditRes.json();

      // Should have no gaps (deliberating decisions don't trigger decision_without_action)
      expect(audit.gaps).toBeTruthy();
      const decisionWithoutActionGaps = audit.gaps.filter(
        (g: { code?: string }) => g.code === 'decision_without_action',
      );
      expect(decisionWithoutActionGaps.length).toBe(0);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('committed decision without action produces gap', async () => {
    /**
     * Control test: committed decision without following action should produce gap.
     */

    const sessionId = await createSession('V7.7 control test');

    try {
      // Submit committed decision_frame (but no action follows)
      await submitThought(
        sessionId,
        'V7.7 committed - but no action',
        'decision_frame',
        {
          decisionState: 'committed',
          options: [{ label: 'A', selected: true }],
        },
      );

      // Run audit
      const auditRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/generate_audit_data`, {
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

      const audit = await auditRes.json();

      // Should have decision_without_action gap (control test)
      const gaps = audit.gaps ?? [];
      const hasDecisionGap = gaps.some(
        (g: { code?: string }) => g.code === 'decision_without_action',
      );
      expect(hasDecisionGap).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
