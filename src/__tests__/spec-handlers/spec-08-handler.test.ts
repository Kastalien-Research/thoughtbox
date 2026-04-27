/**
 * Spec 08 — Per-Session-Type Audit: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V8.2: `sessionType='research'` with 0 belief_snapshots emits `insufficient_belief_snapshots` warning
 * - V8.3: `sessionType='decision'` with no committed decision_frame emits `no_committed_decision` error
 * - V8.4: `sessionType='implementation'` with belief_snapshot emits `unexpected_belief_snapshots` warning
 * - V8.5: `sessionType='debugging'` lacking root cause emits `no_root_cause_identified` error
 * - V8.6: `sessionType='exploration'` always produces `gaps: []`
 * - V8.7: Legacy `decision_without_action` rule suppressed for `research` and `exploration`
 * - V8.8: `tb.session.update({sessionType})` updates column and changes audit rules
 * - V8.9: Audit gaps do not prevent thought submission (non-blocking)
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
    console.warn('⚠️  Supabase not available — V8.* tests will be skipped');
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
      email: `spec-08-${Date.now()}@test.local`,
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
      name: 'spec-08-test',
      slug: `spec-08-${Date.now()}`,
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

async function createSession(title: string, sessionType: string): Promise<string> {
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

async function submitThought(
  sessionId: string,
  thought: string,
  thoughtType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
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
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to submit thought: ${res.status}`);
  }
}

async function runAudit(sessionId: string): Promise<{ gaps: Array<{ code: string; severity: string }> }> {
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/generate_audit_data`, {
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

  if (!res.ok) {
    throw new Error(`generate_audit_data RPC failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// V8.2: research session with 0 belief_snapshots emits insufficient_belief_snapshots
// ---------------------------------------------------------------------------

describe('V8.2 — Research session routing', () => {
  it.skipIf(!ctx.available)('research with 0 belief_snapshots emits insufficient_belief_snapshots warning', async () => {
    /**
     * Check: `sessionType='research'` with 0 belief_snapshots emits
     * `insufficient_belief_snapshots` warning.
     *
     * Pass: aggregator output gap matches.
     */

    const sessionId = await createSession('V8.2 research test', 'research');

    try {
      // Add some reasoning thoughts but no belief_snapshots
      await submitThought(sessionId, 'V8.2 researching this topic', 'reasoning');
      await submitThought(sessionId, 'V8.2 more research', 'reasoning');

      const audit = await runAudit(sessionId);

      const beliefGap = audit.gaps.find(g => g.code === 'insufficient_belief_snapshots');
      expect(beliefGap).toBeTruthy();
      expect(beliefGap.severity).toBe('warning');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.3: decision session with no committed decision emits no_committed_decision
// ---------------------------------------------------------------------------

describe('V8.3 — Decision session routing', () => {
  it.skipIf(!ctx.available)('decision with no committed decision_frame emits no_committed_decision error', async () => {
    /**
     * Check: `sessionType='decision'` with no committed decision_frame emits
     * `no_committed_decision` error.
     *
     * Pass: gap matches.
     */

    const sessionId = await createSession('V8.3 decision test', 'decision');

    try {
      // Add reasoning but no committed decision
      await submitThought(sessionId, 'V8.3 considering options', 'reasoning');

      const audit = await runAudit(sessionId);

      const decisionGap = audit.gaps.find(g => g.code === 'no_committed_decision');
      expect(decisionGap).toBeTruthy();
      expect(decisionGap.severity).toBe('error');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.4: implementation session with belief_snapshot emits unexpected_belief_snapshots
// ---------------------------------------------------------------------------

describe('V8.4 — Implementation session routing', () => {
  it.skipIf(!ctx.available)('implementation with belief_snapshot emits unexpected_belief_snapshots warning', async () => {
    /**
     * Check: `sessionType='implementation'` containing belief_snapshot emits
     * `unexpected_belief_snapshots` warning.
     *
     * Pass: gap matches.
     */

    const sessionId = await createSession('V8.4 implementation test', 'implementation');

    try {
      // Add belief_snapshot (unusual for implementation)
      await submitThought(sessionId, 'V8.4 belief about approach', 'belief_snapshot', {
        belief: 'This is the right approach',
      });

      const audit = await runAudit(sessionId);

      const beliefGap = audit.gaps.find(g => g.code === 'unexpected_belief_snapshots');
      expect(beliefGap).toBeTruthy();
      expect(beliefGap.severity).toBe('warning');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.5: debugging session lacking root cause emits no_root_cause_identified
// ---------------------------------------------------------------------------

describe('V8.5 — Debugging session routing', () => {
  it.skipIf(!ctx.available)('debugging lacking root cause emits no_root_cause_identified error', async () => {
    /**
     * Check: `sessionType='debugging'` lacking `action_report` whose content matches `/root cause/i`
     * emits `no_root_cause_identified` error.
     *
     * Pass: gap matches; same session with one matching action_report passes clean.
     */

    const sessionId = await createSession('V8.5 debugging test', 'debugging');

    try {
      // Add reasoning but no root cause action_report
      await submitThought(sessionId, 'V8.5 investigating the bug', 'reasoning');

      const audit = await runAudit(sessionId);

      const rootCauseGap = audit.gaps.find(g => g.code === 'no_root_cause_identified');
      expect(rootCauseGap).toBeTruthy();
      expect(rootCauseGap.severity).toBe('error');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('debugging with root cause action_report passes clean', async () => {
    /**
     * Control test: debugging with root cause should pass.
     */

    const sessionId = await createSession('V8.5 debugging with root cause', 'debugging');

    try {
      // Add root cause action_report
      await submitThought(sessionId, 'V8.5 root cause: null pointer exception', 'action_report', {
        action: 'Identified root cause',
      });

      const audit = await runAudit(sessionId);

      const rootCauseGap = audit.gaps.find(g => g.code === 'no_root_cause_identified');
      expect(rootCauseGap).toBeUndefined();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.6: exploration session always produces gaps: []
// ---------------------------------------------------------------------------

describe('V8.6 — Exploration session routing', () => {
  it.skipIf(!ctx.available)('exploration always produces gaps: []', async () => {
    /**
     * Check: `sessionType='exploration'` always produces `gaps: []`
     * regardless of contents.
     *
     * Pass: even an empty session yields no gap.
     */

    const sessionId = await createSession('V8.6 exploration test', 'exploration');

    try {
      // Empty session
      const audit = await runAudit(sessionId);
      expect(audit.gaps).toEqual([]);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('exploration with decision_frame produces no gaps', async () => {
    /**
     * Additional check: exploration with various thought types still produces no gaps.
     */

    const sessionId = await createSession('V8.6 exploration with thoughts', 'exploration');

    try {
      await submitThought(sessionId, 'V8.6 exploring options', 'reasoning');
      await submitThought(sessionId, 'V8.6 exploring decisions', 'decision_frame', {
        decisionState: 'deliberating',
        options: [],
      });

      const audit = await runAudit(sessionId);
      expect(audit.gaps).toEqual([]);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.7: Legacy decision_without_action suppressed for research and exploration
// ---------------------------------------------------------------------------

describe('V8.7 — Regression prevention for research and exploration', () => {
  it.skipIf(!ctx.available)('research suppresses legacy decision_without_action rule', async () => {
    /**
     * Check: the legacy 5-thought decision_without_action rule is suppressed
     * for `research` and `exploration`.
     *
     * Pass: pre-spec session fixture (research with decision_frame, no action)
     * yielded 1 gap; post-spec yields 0.
     * Snapshot-test the gap-count delta so a future refactor that re-introduces
     * the rule fails loudly.
     */

    const sessionId = await createSession('V8.7 research suppression test', 'research');

    try {
      // Add decision_frame without following action (pre-spec would produce gap)
      await submitThought(sessionId, 'V8.7 research decision', 'decision_frame', {
        decisionState: 'committed',
        options: [{ label: 'A', selected: true }],
      });

      const audit = await runAudit(sessionId);

      // Should NOT have decision_without_action gap
      const decisionGap = audit.gaps.find(g => g.code === 'decision_without_action');
      expect(decisionGap).toBeUndefined();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('exploration suppresses legacy decision_without_action rule', async () => {
    /**
     * Check: exploration also suppresses the legacy rule.
     */

    const sessionId = await createSession('V8.7 exploration suppression test', 'exploration');

    try {
      await submitThought(sessionId, 'V8.7 exploration decision', 'decision_frame', {
        decisionState: 'committed',
        options: [{ label: 'A', selected: true }],
      });

      const audit = await runAudit(sessionId);

      const decisionGap = audit.gaps.find(g => g.code === 'decision_without_action');
      expect(decisionGap).toBeUndefined();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.8: session.update changes audit rules
// ---------------------------------------------------------------------------

describe('V8.8 — session.update changes audit rules', () => {
  it.skipIf(!ctx.available)('tb.session.update({sessionType}) updates column and changes audit rules', async () => {
    /**
     * Check: `tb.session.update({sessionType:'debugging'})` updates the column
     * and changes the audit rules used on the next `generateAuditData`.
     *
     * Pass: same session re-aggregated produces a different gaps shape.
     */

    const sessionId = await createSession('V8.8 update test', 'research');

    try {
      // Initially research - should not complain about no committed decision
      const audit1 = await runAudit(sessionId);
      expect(audit1.gaps.some(g => g.code === 'no_committed_decision')).toBe(false);

      // Update to decision session type
      await updateSession(sessionId, { session_type: 'decision' });

      // Now should complain about no committed decision
      const audit2 = await runAudit(sessionId);
      expect(audit2.gaps.some(g => g.code === 'no_committed_decision')).toBe(true);

      // Verify the session_type was actually updated
      const sessionRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}&select=session_type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const session = await sessionRes.json();
      expect(session[0].session_type).toBe('decision');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V8.9: Audit gaps are non-blocking
// ---------------------------------------------------------------------------

describe('V8.9 — Audit gaps are non-blocking', () => {
  it.skipIf(!ctx.available)('session with audit gaps still allows thought submission to succeed', async () => {
    /**
     * Check: a session whose audit yields `severity:'error'` still allows
     * `processThought` to return success.
     *
     * Pass: gap is in the manifest, response status is 200.
     */

    const sessionId = await createSession('V8.9 non-blocking test', 'decision');

    try {
      // Submit thought (should succeed even though audit will have errors)
      const thoughtRes = await fetch(`${SUPABASE_TEST_URL}/rest/v1/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          session_id: sessionId,
          workspace_id: ctx.workspaceId,
          thought: 'V8.9 thought in problematic session',
          thought_type: 'reasoning',
          thought_number: 1,
          next_thought_needed: false,
          total_thoughts: null,
        }),
      });

      // Should succeed
      expect(thoughtRes.ok).toBe(true);
      expect(thoughtRes.status).toBe(201);

      // But audit should have errors
      const audit = await runAudit(sessionId);
      expect(audit.gaps.some(g => g.severity === 'error')).toBe(true);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
