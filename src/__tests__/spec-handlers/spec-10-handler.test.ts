/**
 * Spec 10 — Knowledge Graph Persistence Shortcut: HANDLER validation tests
 *
 * Validators (from VALIDATORS.md):
 * - V10.1: `belief_snapshot` + `persistAs` creates KG entity of type `Concept`
 * - V10.2: `assumption_update` with `newStatus='refuted'` produces type `Decision`
 * - V10.3: Non-refuted assumption produces type `Concept`
 * - V10.4: Downstream assumption produces type `Decision`
 * - V10.5: `relationTo` creates `BUILDS_ON` relation
 * - V10.6: Failure atomicity - thought persists even if KG creation fails
 * - V10.8: `RELATION_TARGET_NOT_FOUND` error code on bad `relationTo`
 * - V10.9: Visibility defaults to `agent-private`
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
    console.warn('⚠️  Supabase not available — V10.* tests will be skipped');
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
      email: `spec-10-${Date.now()}@test.local`,
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
      name: 'spec-10-test',
      slug: `spec-10-${Date.now()}`,
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

async function createEntity(
  name: string,
  type: string,
  visibility = 'agent-private',
  workspaceId?: string,
): Promise<string> {
  const res = await fetch(`${SUPABASE_TEST_URL}/rest/v1/kg_entities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
      apikey: SUPABASE_TEST_SERVICE_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name,
      type,
      visibility,
      workspace_id: workspaceId ?? ctx.workspaceId,
    }),
  });
  const entity = await res.json();
  return entity.id;
}

async function submitThought(
  sessionId: string,
  thought: string,
  thoughtType: string,
  metadata?: Record<string, unknown>,
): Promise<{ id: string; thought_number: number }> {
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
// V10.1: belief_snapshot + persistAs creates KG entity of type Concept
// ---------------------------------------------------------------------------

describe('V10.1 — belief_snapshot + persistAs creates Concept entity', () => {
  it.skipIf(!ctx.available)('creates kg_entities row with type=Concept', async () => {
    /**
     * Check: `belief_snapshot` + `persistAs={name:'X', visibility:'team-private'}`
     * creates `kg_entities` row with `type='Concept'` and `visibility='team-private'`.
     *
     * Pass: all four assertions hold in one transaction:
     * entity exists, type is Concept, visibility is team-private, observation links back.
     */

    const sessionId = await createSession('V10.1 belief persist test');

    try {
      // Submit belief_snapshot with persistAs
      const result = await submitThought(
        sessionId,
        'V10.1 belief about system design',
        'belief_snapshot',
        {
          belief: 'Microservices are better for scaling',
          persistAs: {
            name: 'microservices-vs-monolith',
            visibility: 'team-private',
          },
        },
      );

      const thoughtNumber = result.thought_number;

      // Check entity was created
      const entityRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.microservices-vs-monolith&select=id,type,visibility`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entityRes.json();

      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('Concept');
      expect(entities[0].visibility).toBe('team-private');

      // Check observation links back to thought
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

      // Check thought metadata has kgPersistSuccess
      const thoughtRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?id=eq.${result.id}&select=metadata`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thought = await thoughtRes.json();
      expect(thought[0].metadata.kgPersistSuccess).toBeTruthy();
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.2: assumption_update with refuted produces Decision type
// ---------------------------------------------------------------------------

describe('V10.2 — Refuted assumption produces Decision entity', () => {
  it.skipIf(!ctx.available)('assumption_update with newStatus=refuted produces type=Decision', async () => {
    /**
     * Check: `assumption_update` with `assumptionChange.newStatus='refuted'`
     * produces `type='Decision'`.
     *
     * Pass: SQL select.
     */

    const sessionId = await createSession('V10.2 refuted assumption test');

    try {
      await submitThought(
        sessionId,
        'V10.2 assumption that was refuted',
        'assumption_update',
        {
          assumptionChange: {
            text: 'Original assumption',
            oldStatus: 'believed',
            newStatus: 'refuted',
          },
          persistAs: {
            name: 'refuted-assumption',
          },
        },
      );

      // Check entity type is Decision
      const entityRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.refuted-assumption&select=type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entityRes.json();

      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('Decision');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.3: Non-refuted assumption produces Concept type
// ---------------------------------------------------------------------------

describe('V10.3 — Non-refuted assumption produces Concept entity', () => {
  it.skipIf(!ctx.available)('assumption_update with newStatus=uncertain produces type=Concept', async () => {
    /**
     * Check: `believed → uncertain` (no committed decision dependency)
     * produces `type='Concept'`.
     *
     * Pass: SQL select.
     */

    const sessionId = await createSession('V10.3 uncertain assumption test');

    try {
      await submitThought(
        sessionId,
        'V10.3 assumption status changed but not refuted',
        'assumption_update',
        {
          assumptionChange: {
            text: 'Original assumption',
            oldStatus: 'believed',
            newStatus: 'uncertain',
          },
          persistAs: {
            name: 'uncertain-assumption',
          },
        },
      );

      // Check entity type is Concept
      const entityRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.uncertain-assumption&select=type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entityRes.json();

      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('Concept');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.4: Downstream assumption produces Decision type
// ---------------------------------------------------------------------------

describe('V10.4 — Downstream assumption dependency produces Decision entity', () => {
  it.skipIf(!ctx.available)('downstream assumption with prior decision produces type=Decision', async () => {
    /**
     * Check: prior committed `decision_frame` in same session, then
     * `assumption_update` with `downstream:[<that thoughtNumber>]` produces `type='Decision'`.
     *
     * Pass: SQL select.
     */

    const sessionId = await createSession('V10.4 downstream assumption test');

    try {
      // First, create a committed decision
      await submitThought(sessionId, 'V10.4 decision made here', 'decision_frame', {
        decisionState: 'committed',
        options: [{ label: 'A', selected: true }],
      });

      // Then create downstream assumption
      await submitThought(
        sessionId,
        'V10.4 assumption downstream of decision',
        'assumption_update',
        {
          assumptionChange: {
            text: 'Assumption based on decision',
            oldStatus: 'believed',
            newStatus: 'uncertain',
            downstream: [1], // References the decision above
          },
          persistAs: {
            name: 'downstream-assumption',
          },
        },
      );

      // Check entity type is Decision
      const entityRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.downstream-assumption&select=type`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entityRes.json();

      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('Decision');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.5: relationTo creates BUILDS_ON relation
// ---------------------------------------------------------------------------

describe('V10.5 — relationTo creates BUILDS_ON relation', () => {
  it.skipIf(!ctx.available)('persistAs with relationTo creates BUILDS_ON relation', async () => {
    /**
     * Check: `relationTo` creates `BUILDS_ON` relation row from new entity to target.
     *
     * Pass: `SELECT * FROM kg_relations WHERE from_id=$new AND to_id=$existing
     * AND relation_type='BUILDS_ON'` returns 1 row.
     */

    const sessionId = await createSession('V10.5 relation test');

    try {
      // Create first entity
      const entity1Id = await createEntity('v10-5-base-entity', 'Concept');

      // Create second entity that builds on the first
      await submitThought(
        sessionId,
        'V10.5 this builds on the base entity',
        'belief_snapshot',
        {
          belief: 'Building on the base',
          persistAs: {
            name: 'v10-5-derived-entity',
            relationTo: entity1Id,
          },
        },
      );

      // Find the derived entity
      const derivedRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.v10-5-derived-entity&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const derived = await derivedRes.json();
      const derivedId = derived[0].id;

      // Check BUILDS_ON relation exists
      const relRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_relations?from_id=eq.${derivedId}&to_id=eq.${entity1Id}&relation_type=eq.BUILDS_ON&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const relations = await relRes.json();

      expect(relations.length).toBe(1);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.6: Failure atomicity - thought persists even if KG creation fails
// ---------------------------------------------------------------------------

describe('V10.6 — Failure atomicity for KG persistence', () => {
  it.skipIf(!ctx.available)('thought persists even if KG creation fails', async () => {
    /**
     * Check: provoke `ENTITY_NAME_CONFLICT` (pre-insert clashing entity);
     * thought still persists; `metadata.kgPersistError = {code:'ENTITY_NAME_CONFLICT', details:{existingEntityId,…}}`;
     * **no** new entity row.
     *
     * Pass: row counts pre and post differ by exactly 1 thought, 0 entities;
     * metadata shape matches.
     */

    const sessionId = await createSession('V10.6 failure atomicity test');
    const entityName = `v10-6-conflict-${Date.now()}`;

    try {
      // Create initial entity
      await createEntity(entityName, 'Concept');

      // Count entities before
      const entitiesBeforeRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.${entityName}&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entitiesBefore = await entitiesBeforeRes.json();
      const entityCountBefore = entitiesBefore.length;

      // Attempt to create another entity with same name (should fail)
      await submitThought(
        sessionId,
        'V10.6 this should fail due to name conflict',
        'belief_snapshot',
        {
          belief: 'Conflicting belief',
          persistAs: {
            name: entityName, // Same name - should conflict
          },
        },
      );

      // Count entities after
      const entitiesAfterRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.${entityName}&select=id`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entitiesAfter = await entitiesAfterRes.json();
      const entityCountAfter = entitiesAfter.length;

      // Entity count should be unchanged (0 new entities)
      expect(entityCountAfter).toBe(entityCountBefore);

      // Find the thought and check it has kgPersistError
      const thoughtsRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?session_id=eq.${sessionId}&thought_type=eq.belief_snapshot&select=id,metadata`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thoughts = await thoughtsRes.json();

      // Should have at least one thought (the failed one persisted)
      expect(thoughts.length).toBeGreaterThanOrEqual(1);

      // The failed thought should have kgPersistError metadata
      const failedThought = thoughts.find(
        (t: { metadata: { kgPersistError?: unknown } }) => t.metadata?.kgPersistError,
      );
      expect(failedThought).toBeTruthy();
      expect(failedThought.metadata.kgPersistError.code).toBe('ENTITY_NAME_CONFLICT');
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.8: RELATION_TARGET_NOT_FOUND error code on bad relationTo
// ---------------------------------------------------------------------------

describe('V10.8 — RELATION_TARGET_NOT_FOUND error code', () => {
  it.skipIf(!ctx.available)('bad relationTo produces RELATION_TARGET_NOT_FOUND error', async () => {
    /**
     * Check: `relationTo='non-existent-id'` produces that error code with
     * `attemptedRelationTo` in details.
     *
     * Pass: metadata shape match.
     */

    const sessionId = await createSession('V10.8 relation error test');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    try {
      await submitThought(
        sessionId,
        'V10.8 this has a bad relationTo',
        'belief_snapshot',
        {
          belief: 'Belief with bad relation',
          persistAs: {
            name: 'v10-8-bad-relation',
            relationTo: nonExistentId,
          },
        },
      );

      // Find the thought
      const thoughtsRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/thoughts?session_id=eq.${sessionId}&thought_type=eq.belief_snapshot&select=metadata`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const thoughts = await thoughtsRes.json();

      // Should have kgPersistError with RELATION_TARGET_NOT_FOUND
      const errorThought = thoughts.find(
        (t: { metadata: { kgPersistError?: { code?: string } } }) => t.metadata?.kgPersistError,
      );
      expect(errorThought).toBeTruthy();
      expect(errorThought.metadata.kgPersistError.code).toBe('RELATION_TARGET_NOT_FOUND');
      expect(errorThought.metadata.kgPersistError.attemptedRelationTo).toBe(nonExistentId);
    } finally {
      await fetch(`${SUPABASE_TEST_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`, apikey: SUPABASE_TEST_SERVICE_KEY },
      });
    }
  });
});

// ---------------------------------------------------------------------------
// V10.9: Visibility defaults to agent-private
// ---------------------------------------------------------------------------

describe('V10.9 — Default visibility is agent-private', () => {
  it.skipIf(!ctx.available)('omitted visibility defaults to agent-private on persisted entity', async () => {
    /**
     * Check: omitted `visibility` resolves to `agent-private` on the persisted entity.
     *
     * Pass: SQL select.
     */

    const sessionId = await createSession('V10.9 default visibility test');

    try {
      await submitThought(
        sessionId,
        'V10.9 belief with default visibility',
        'belief_snapshot',
        {
          belief: 'Belief with default visibility',
          persistAs: {
            name: 'v10-9-default-visibility',
            // No visibility - should default to agent-private
          },
        },
      );

      // Check entity visibility
      const entityRes = await fetch(
        `${SUPABASE_TEST_URL}/rest/v1/kg_entities?name=eq.v10-9-default-visibility&select=visibility`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_TEST_SERVICE_KEY}`,
            apikey: SUPABASE_TEST_SERVICE_KEY,
          },
        },
      );
      const entities = await entityRes.json();

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
