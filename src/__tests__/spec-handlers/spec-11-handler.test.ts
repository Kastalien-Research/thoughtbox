/**
 * Spec 11 — Structured Return Schemas: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V11.1: Schema-pass path produces `ValidatedOutput<T>` with `success:true`
 * - V11.2: Schema-fail path throws `StructuredOutputError`
 * - V11.3: Parse-fail path throws `StructuredOutputError` with `parsingError`
 * - V11.4: Validation failure means no thought row inserted
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
    console.warn('⚠️  Supabase not available — V11.* tests will be skipped');
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
      email: `spec-11-${Date.now()}@test.local`,
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
      name: 'spec-11-test',
      slug: `spec-11-${Date.now()}`,
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
// V11.1: Schema-pass path produces ValidatedOutput<T> with success:true
// ---------------------------------------------------------------------------

describe('V11.1 — Schema-pass path', () => {
  it.skipIf(!ctx.available)('dispatch with valid return produces ValidatedOutput with success:true', async () => {
    /**
     * Check: subagent dispatched with `expectedReturn.schema` and a return matching it
     * produces `ValidatedOutput<T>` with `success:true` and typed `data`.
     *
     * Pass: result deep-equals expected; type-fixture asserts `data` typed as
     * the schema's TS shape.
     */

    const sessionId = await createSession('V11.1 schema pass test');

    try {
      // Dispatch subagent with schema expectation
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/dispatch_subagent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_prompt: 'Return a valid result matching the schema',
          p_expected_return: {
            schema: {
              type: 'object',
              properties: {
                result: { type: 'string' },
                count: { type: 'number' },
              },
              required: ['result', 'count'],
            },
          },
          p_return_value: {
            result: 'success',
            count: 42,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`dispatch_subagent RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();

      // Should have success
      expect(result.success).toBe(true);

      // Should have typed data
      expect(result.data).toBeTruthy();
      expect(result.data.result).toBe('success');
      expect(result.data.count).toBe(42);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V11.2: Schema-fail path throws StructuredOutputError
// ---------------------------------------------------------------------------

describe('V11.2 — Schema-fail path', () => {
  it.skipIf(!ctx.available)('invalid return schema throws StructuredOutputError', async () => {
    /**
     * Check: invalid return throws `StructuredOutputError` with
     * `type==='structured_output_error'` and `validationErrors[0]` populated
     * with `path`, `expected`, `received`.
     *
     * Pass: thrown error matches Zod parse of `StructuredOutputErrorSchema`.
     */

    const sessionId = await createSession('V11.2 schema fail test');

    try {
      // Dispatch subagent with schema expectation but invalid return
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/dispatch_subagent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_prompt: 'Return an invalid result',
          p_expected_return: {
            schema: {
              type: 'object',
              properties: {
                count: { type: 'number' },
              },
              required: ['count'],
            },
          },
          // Return string where number is expected
          p_return_value: {
            count: 'not-a-number',
          },
        }),
      });

      // Should fail (not ok)
      expect(res.ok).toBe(false);

      const error = await res.json();

      // Should have structured output error type
      expect(error.type).toBe('structured_output_error');

      // Should have validation errors
      expect(error.validationErrors).toBeTruthy();
      expect(error.validationErrors.length).toBeGreaterThan(0);

      // First error should have path, expected, received
      const firstError = error.validationErrors[0];
      expect(firstError.path).toBeTruthy();
      expect(firstError.expected).toBeTruthy();
      expect(firstError.received).toBeTruthy();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V11.3: Parse-fail path throws StructuredOutputError with parsingError
// ---------------------------------------------------------------------------

describe('V11.3 — Parse-fail path', () => {
  it.skipIf(!ctx.available)('non-JSON return throws StructuredOutputError with parsingError', async () => {
    /**
     * Check: subagent returns non-JSON; resulting error has `parsingError.offset >= 0`.
     *
     * Pass: error matches; `validationErrors` is empty.
     */

    const sessionId = await createSession('V11.3 parse fail test');

    try {
      // Dispatch subagent with non-JSON return
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/dispatch_subagent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_prompt: 'Return something that is not JSON',
          p_expected_return: {
            schema: {
              type: 'object',
              properties: {
                result: { type: 'string' },
              },
            },
          },
          // Non-JSON return value
          p_return_value: 'this is not json{{{',
        }),
      });

      // Should fail
      expect(res.ok).toBe(false);

      const error = await res.json();

      // Should have structured output error type
      expect(error.type).toBe('structured_output_error');

      // Should have parsing error
      expect(error.parsingError).toBeTruthy();
      expect(typeof error.parsingError.offset).toBe('number');
      expect(error.parsingError.offset).toBeGreaterThanOrEqual(0);

      // validationErrors should be empty
      expect(error.validationErrors).toBeTruthy();
      expect(error.validationErrors.length).toBe(0);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V11.4: Validation failure means no thought row inserted
// ---------------------------------------------------------------------------

describe('V11.4 — No-attach on validation failure', () => {
  it.skipIf(!ctx.available)('validation failure means no thought row inserted', async () => {
    /**
     * Check: validation failure means no thought row inserted in parent session.
     *
     * Pass: `SELECT COUNT(*) FROM thoughts WHERE session_id=$parent` unchanged
     * across the failed dispatch.
     */

    const sessionId = await createSession('V11.4 no-attach test');

    try {
      // Get initial thought count
      const countBefore = await getThoughtCount(sessionId);

      // Attempt dispatch that will fail validation
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/dispatch_subagent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_prompt: 'Return invalid',
          p_expected_return: {
            schema: { type: 'object' },
          },
          p_return_value: {
            invalid: 'data',
            that: 'should fail',
            validation: 'because schema is different',
          },
        }),
      });

      // Should fail
      expect(res.ok).toBe(false);

      // Get thought count after
      const countAfter = await getThoughtCount(sessionId);

      // Count should be unchanged
      expect(countAfter).toBe(countBefore);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('successful dispatch does insert thought row', async () => {
    /**
     * Control test: successful dispatch should insert thought row.
     */

    const sessionId = await createSession('V11.4 success insert test');

    try {
      // Get initial thought count
      const countBefore = await getThoughtCount(sessionId);

      // Successful dispatch
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/dispatch_subagent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_prompt: 'Return valid',
          p_expected_return: {
            schema: {
              type: 'object',
              properties: {
                result: { type: 'string' },
              },
            },
          },
          p_return_value: {
            result: 'success',
          },
        }),
      });

      // Should succeed
      expect(res.ok).toBe(true);

      // Get thought count after
      const countAfter = await getThoughtCount(sessionId);

      // Count should increase by 1
      expect(countAfter).toBe(countBefore + 1);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
