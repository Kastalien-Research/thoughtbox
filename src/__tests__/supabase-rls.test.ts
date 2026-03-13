/**
 * RLS (Row-Level Security) isolation tests.
 *
 * ADR Hypothesis H3: project isolation via RLS policies.
 * Inserts data for project-A and project-B via service_role,
 * then verifies that a client scoped to project-A sees 0 rows from project-B.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  isSupabaseAvailable,
  createServiceClient,
  createTestClient,
  truncateAllTables,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_ANON_KEY,
} from './supabase-test-helpers.js';

describe('H3: RLS project isolation', () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await truncateAllTables();
  });

  it('project-A client cannot see project-B sessions', async ({ skip }) => {
    if (!available) skip();
    const service = createServiceClient();

    // Insert sessions for two projects via service_role (bypasses RLS)
    const { error: errA } = await service.from('sessions').insert({
      project: 'project-alpha',
      title: 'Alpha Session',
      tags: [],
    });
    expect(errA).toBeNull();

    const { error: errB } = await service.from('sessions').insert({
      project: 'project-beta',
      title: 'Beta Session',
      tags: [],
    });
    expect(errB).toBeNull();

    // Client scoped to project-alpha
    const clientA = createTestClient('project-alpha');
    const { data: sessionsA, error: queryErrA } = await clientA
      .from('sessions')
      .select();

    expect(queryErrA).toBeNull();
    expect(sessionsA).toHaveLength(1);
    expect(sessionsA![0].title).toBe('Alpha Session');

    // Client scoped to project-beta
    const clientB = createTestClient('project-beta');
    const { data: sessionsB, error: queryErrB } = await clientB
      .from('sessions')
      .select();

    expect(queryErrB).toBeNull();
    expect(sessionsB).toHaveLength(1);
    expect(sessionsB![0].title).toBe('Beta Session');
  });

  it('project-A client cannot see project-B thoughts', async ({ skip }) => {
    if (!available) skip();
    const service = createServiceClient();

    // Create sessions for each project
    const { data: sessionA } = await service.from('sessions').insert({
      project: 'project-alpha',
      title: 'Alpha',
      tags: [],
    }).select().single();

    const { data: sessionB } = await service.from('sessions').insert({
      project: 'project-beta',
      title: 'Beta',
      tags: [],
    }).select().single();

    // Insert thoughts for each
    await service.from('thoughts').insert({
      session_id: sessionA!.id,
      project: 'project-alpha',
      thought: 'Alpha thought',
      thought_number: 1,
      total_thoughts: 1,
      next_thought_needed: false,
      thought_type: 'reasoning',
    });

    await service.from('thoughts').insert({
      session_id: sessionB!.id,
      project: 'project-beta',
      thought: 'Beta thought',
      thought_number: 1,
      total_thoughts: 1,
      next_thought_needed: false,
      thought_type: 'reasoning',
    });

    // Client A should only see its own thoughts
    const clientA = createTestClient('project-alpha');
    const { data: thoughtsA } = await clientA.from('thoughts').select();
    expect(thoughtsA).toHaveLength(1);
    expect(thoughtsA![0].thought).toBe('Alpha thought');
  });

  it('project-A client cannot see project-B entities', async ({ skip }) => {
    if (!available) skip();
    const service = createServiceClient();

    await service.from('entities').insert({
      project: 'project-alpha',
      name: 'alpha-entity',
      type: 'Concept',
      label: 'Alpha Entity',
    });

    await service.from('entities').insert({
      project: 'project-beta',
      name: 'beta-entity',
      type: 'Concept',
      label: 'Beta Entity',
    });

    const clientA = createTestClient('project-alpha');
    const { data: entitiesA } = await clientA.from('entities').select();
    expect(entitiesA).toHaveLength(1);
    expect(entitiesA![0].name).toBe('alpha-entity');
  });

  it('project-A client cannot see project-B observations', async ({ skip }) => {
    if (!available) skip();
    const service = createServiceClient();

    // Create entities in each project
    const { data: entityA } = await service.from('entities').insert({
      project: 'project-alpha',
      name: 'e-alpha',
      type: 'Insight',
      label: 'EA',
    }).select().single();

    const { data: entityB } = await service.from('entities').insert({
      project: 'project-beta',
      name: 'e-beta',
      type: 'Insight',
      label: 'EB',
    }).select().single();

    await service.from('observations').insert({
      project: 'project-alpha',
      entity_id: entityA!.id,
      content: 'Alpha observation',
    });

    await service.from('observations').insert({
      project: 'project-beta',
      entity_id: entityB!.id,
      content: 'Beta observation',
    });

    const clientA = createTestClient('project-alpha');
    const { data: obsA } = await clientA.from('observations').select();
    expect(obsA).toHaveLength(1);
    expect(obsA![0].content).toBe('Alpha observation');
  });

  it('project-A client cannot see project-B relations', async ({ skip }) => {
    if (!available) skip();
    const service = createServiceClient();

    const { data: eA1 } = await service.from('entities').insert({
      project: 'project-alpha', name: 'a1', type: 'Concept', label: 'A1',
    }).select().single();
    const { data: eA2 } = await service.from('entities').insert({
      project: 'project-alpha', name: 'a2', type: 'Concept', label: 'A2',
    }).select().single();

    const { data: eB1 } = await service.from('entities').insert({
      project: 'project-beta', name: 'b1', type: 'Concept', label: 'B1',
    }).select().single();
    const { data: eB2 } = await service.from('entities').insert({
      project: 'project-beta', name: 'b2', type: 'Concept', label: 'B2',
    }).select().single();

    await service.from('relations').insert({
      project: 'project-alpha', from_id: eA1!.id, to_id: eA2!.id, type: 'RELATES_TO',
    });
    await service.from('relations').insert({
      project: 'project-beta', from_id: eB1!.id, to_id: eB2!.id, type: 'RELATES_TO',
    });

    const clientA = createTestClient('project-alpha');
    const { data: relsA } = await clientA.from('relations').select();
    expect(relsA).toHaveLength(1);
  });
});
