/**
 * Spec 04 — Subagent Session Attachment: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V4.1: Default `thoughtType` is `context_snapshot`
 * - V4.2: `SubagentOutput` appears verbatim under `metadata.subagentOutput`
 * - V4.3: When `entityName` is set, a `kg_entities` row exists
 * - V4.4: Missing `visibility` resolves to `agent-private`
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
    console.warn('⚠️  Supabase not available — V4.* tests will be skipped');
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
      email: `spec-04-${Date.now()}@test.local`,
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
      name: 'spec-04-test',
      slug: `spec-04-${Date.now()}`,
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
  metadata?: Record<string, unknown>,
): Promise<unknown> {
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
  return res.json();
}

// ---------------------------------------------------------------------------
// V4.1: Default thoughtType is context_snapshot
// ---------------------------------------------------------------------------

describe('V4.1 — Default thoughtType for subagent.attach', () => {
  it.skipIf(!ctx.available)('subagent attach defaults to thoughtType context_snapshot', async () => {
    /**
     * Check: default `thoughtType` is `context_snapshot`.
     *
     * Pass: `SELECT thought_type FROM thoughts WHERE id = $created`
     * returns `'context_snapshot'`.
     */

    const sessionId = await createSession('V4.1 test session');

    try {
      // Submit thought via subagent attach RPC
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/subagent_attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_content: 'Subagent output content',
          p_completed_at: new Date().toISOString(),
          p_duration_ms: 1000,
          p_model: 'gpt-4',
        }),
      });

      if (!res.ok) {
        throw new Error(`subagent_attach RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      const thoughtId = result.thought_id;

      // Fetch the thought and verify thought_type
      const thoughtRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?id=eq.${thoughtId}&select=thought_type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thought = await thoughtRes.json();
      expect(thought[0].thought_type).toBe('context_snapshot');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V4.2: SubagentOutput appears verbatim under metadata.subagentOutput
// ---------------------------------------------------------------------------

describe('V4.2 — SubagentOutput metadata roundtrip', () => {
  it.skipIf(!ctx.available)('SubagentOutput appears verbatim under metadata.subagentOutput', async () => {
    /**
     * Check: passed `SubagentOutput` appears verbatim under `metadata.subagentOutput` JSONB.
     *
     * Pass: `metadata->'subagentOutput'->>'content'` equals input `content`;
     * `completedAt`, `durationMs`, `model` survive the roundtrip.
     */

    const sessionId = await createSession('V4.2 test session');

    try {
      const subagentOutput = {
        content: 'V4.2 test subagent content',
        completedAt: '2024-01-15T10:30:00.000Z',
        durationMs: 2500,
        model: 'claude-3-opus',
      };

      // Submit via subagent_attach
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/subagent_attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_content: subagentOutput.content,
          p_completed_at: subagentOutput.completedAt,
          p_duration_ms: subagentOutput.durationMs,
          p_model: subagentOutput.model,
        }),
      });

      if (!res.ok) {
        throw new Error(`subagent_attach RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      const thoughtId = result.thought_id;

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

      // Verify subagentOutput is present and matches input
      expect(metadata.subagentOutput).toBeTruthy();
      expect(metadata.subagentOutput.content).toBe(subagentOutput.content);
      expect(metadata.subagentOutput.completedAt).toBe(subagentOutput.completedAt);
      expect(metadata.subagentOutput.durationMs).toBe(subagentOutput.durationMs);
      expect(metadata.subagentOutput.model).toBe(subagentOutput.model);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V4.3: When entityName is set, a kg_entities row exists
// ---------------------------------------------------------------------------

describe('V4.3 — KG entity creation when entityName is set', () => {
  it.skipIf(!ctx.available)('subagent attach with entityName creates kg_entities row', async () => {
    /**
     * Check: when `entityName` is set, a `kg_entities` row exists with that name
     * and an observation linking to the new thought.
     *
     * Pass: `SELECT … FROM kg_entities WHERE name = $entityName` returns one row;
     * an observation row exists with `source_thought = thought_number`.
     * When `entityName` is omitted, no entity row exists.
     */

    const sessionId = await createSession('V4.3 test session');
    const entityName = `test-entity-${Date.now()}`;

    try {
      // Submit via subagent_attach with entityName
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/subagent_attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_content: 'V4.3 content with entity',
          p_completed_at: new Date().toISOString(),
          p_duration_ms: 1000,
          p_model: 'test-model',
          p_entity_name: entityName,
        }),
      });

      if (!res.ok) {
        throw new Error(`subagent_attach RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();
      const thoughtNumber = result.thought_number;

      // Check kg_entities row exists
      const entitiesRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.${entityName}&select=id,name,type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entitiesRes.json();
      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe(entityName);

      // Check observation exists linking to the thought
      const obsRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/observations?entity_id=eq.${entities[0].id}&select=id,source_thought`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const observations = await obsRes.json();
      expect(observations.length).toBeGreaterThanOrEqual(1);
      expect(observations[0].source_thought).toBe(thoughtNumber);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });

  it.skipIf(!ctx.available)('subagent attach without entityName creates no kg_entities row', async () => {
    /**
     * When entityName is omitted, no entity row exists.
     */

    const sessionId = await createSession('V4.3 no-entity test');

    try {
      // Submit via subagent_attach WITHOUT entityName
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/subagent_attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_content: 'V4.3 content without entity',
          p_completed_at: new Date().toISOString(),
          p_duration_ms: 1000,
          p_model: 'test-model',
          // No entity_name
        }),
      });

      if (!res.ok) {
        throw new Error(`subagent_attach RPC failed: ${res.status} ${await res.text()}`);
      }

      const result = await res.json();

      // Check no entities were created for this session's thoughts
      const thoughtId = result.thought_id;
      const thoughtRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?id=eq.${thoughtId}&select=thought_number`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thought = await thoughtRes.json();
      const thoughtNumber = thought[0].thought_number;

      // No entities should reference this thought
      const entitiesRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?workspace_id=eq.${ctx.workspaceId}&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entitiesRes.json();

      // If entities exist, none should have an observation for this thought
      if (entities.length > 0) {
        for (const entity of entities) {
          const obsRes = await fetch(
            `${SUPABASE_TEST_URL}/rest/v1/observations?entity_id=eq.${entity.id}&source_thought=eq.${thoughtNumber}&select=id`,
            {
              headers: {
                Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
                apikey: SUPABASE_TEST_SERVICE_KEY,
              },
            },
          );
          const obs = await obsRes.json();
          expect(obs.length).toBe(0);
        }
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
// V4.4: Missing visibility resolves to agent-private
// ---------------------------------------------------------------------------

describe('V4.4 — Default visibility is agent-private', () => {
  it.skipIf(!ctx.available)('missing visibility resolves to agent-private on persisted entity', async () => {
    /**
     * Check: missing `visibility` resolves to `agent-private`.
     *
     * Pass: created entity row's `visibility` column equals `'agent-private'`.
     */

    const sessionId = await createSession('V4.4 test session');
    const entityName = `test-entity-visibility-${Date.now()}`;

    try {
      // Submit via subagent_attach with entityName but no visibility
      const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/rpc/subagent_attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
          apikey: SUPABASE_TEST_SERVICE_KEY,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_workspace_id: ctx.workspaceId,
          p_content: 'V4.4 content',
          p_completed_at: new Date().toISOString(),
          p_duration_ms: 1000,
          p_model: 'test-model',
          p_entity_name: entityName,
          // No visibility - should default to agent-private
        }),
      });

      if (!res.ok) {
        throw new Error(`subagent_attach RPC failed: ${res.status} ${await res.text()}`);
      }

      // Check entity visibility
      const entitiesRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.${entityName}&select=visibility`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entitiesRes.json();
      expect(entities.length).toBe(1);
      expect(entities[0].visibility).toBe('agent-private');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});
