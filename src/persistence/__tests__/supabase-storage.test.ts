/**
 * Integration tests for SupabaseStorage (ThoughtboxStorage interface).
 *
 * Requires a local Supabase instance via `supabase start`.
 * No mocking of @supabase/supabase-js -- all tests hit real Postgres.
 *
 * ADR Hypotheses validated:
 *   H1 -- Full ThoughtboxStorage interface (session CRUD, thought CRUD, branch ops, critique, export)
 *   H2 -- ThoughtNode linked-list reconstruction via toLinkedExport()
 *   H5 -- UNIQUE NULLS NOT DISTINCT constraint
 *   H7 -- Trigger-based count consistency (parallel saveThought)
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { SupabaseStorage } from '../supabase-storage.js';
import {
  isSupabaseAvailable,
  getTestSupabaseConfig,
  truncateAllTables,
} from '../../__tests__/supabase-test-helpers.js';
import type { ThoughtData } from '../types.js';

function makeThought(overrides: Partial<ThoughtData> & { thoughtNumber: number }): ThoughtData {
  return {
    thought: `Thought ${overrides.thoughtNumber}`,
    thoughtNumber: overrides.thoughtNumber,
    totalThoughts: overrides.totalThoughts ?? 5,
    nextThoughtNeeded: overrides.nextThoughtNeeded ?? true,
    timestamp: new Date().toISOString(),
    thoughtType: overrides.thoughtType ?? 'reasoning',
    ...overrides,
  };
}

describe('SupabaseStorage (ThoughtboxStorage)', () => {
  let storage: SupabaseStorage;
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await truncateAllTables();
    storage = new SupabaseStorage({
      ...getTestSupabaseConfig(),
      workspaceId: '11111111-1111-1111-1111-111111111111',
    });
    await storage.initialize();
  });

  // ===========================================================================
  // H1: Full ThoughtboxStorage interface
  // ===========================================================================

  describe('H1: Session CRUD', () => {
    it('creates and retrieves a session', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({
        title: 'Test Session',
        description: 'A test session',
        tags: ['test', 'integration'],
      });

      expect(session.id).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.description).toBe('A test session');
      expect(session.tags).toEqual(['test', 'integration']);
      expect(session.thoughtCount).toBe(0);
      expect(session.branchCount).toBe(0);

      const retrieved = await storage.getSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Test Session');
    });

    it('persists mcpSessionId in session create/get/list operations', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({
        title: 'Run-key Session',
        description: 'MCP session ID should persist',
        tags: ['run-key'],
        mcpSessionId: 'mcp-test-123',
      });

      const fetched = await storage.getSession(session.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.mcpSessionId).toBe('mcp-test-123');

      const listed = await storage.listSessions({ search: 'Run-key' });
      expect(listed).toHaveLength(1);
      expect(listed[0].mcpSessionId).toBe('mcp-test-123');
    });

    it('omits mcpSessionId when createSession does not provide it', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'No Run Key' });
      const fetched = await storage.getSession(session.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.mcpSessionId).toBeUndefined();
    });

    it('returns null for nonexistent session', async ({ skip }) => {
      if (!available) skip();
      const result = await storage.getSession('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    it('updates a session', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Original' });
      const updated = await storage.updateSession(session.id, {
        title: 'Updated',
        tags: ['new-tag'],
      });

      expect(updated.title).toBe('Updated');
      expect(updated.tags).toEqual(['new-tag']);
    });

    it('deletes a session and its thoughts', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'To Delete' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      await storage.deleteSession(session.id);

      const result = await storage.getSession(session.id);
      expect(result).toBeNull();

      const thoughts = await storage.getThoughts(session.id);
      expect(thoughts).toHaveLength(0);
    });

    it('lists sessions with filtering', async ({ skip }) => {
      if (!available) skip();
      await storage.createSession({ title: 'Alpha', tags: ['a'] });
      await storage.createSession({ title: 'Beta', tags: ['b'] });
      await storage.createSession({ title: 'Alpha Two', tags: ['a', 'c'] });

      const byTag = await storage.listSessions({ tags: ['a'] });
      expect(byTag).toHaveLength(2);

      const bySearch = await storage.listSessions({ search: 'Beta' });
      expect(bySearch).toHaveLength(1);
      expect(bySearch[0].title).toBe('Beta');

      const limited = await storage.listSessions({ limit: 1 });
      expect(limited).toHaveLength(1);
    });
  });

  describe('H1: Thought CRUD', () => {
    it('saves and retrieves thoughts on main chain', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Thoughts Test' });

      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 2 }));

      const thoughts = await storage.getThoughts(session.id);
      expect(thoughts).toHaveLength(2);
      expect(thoughts[0].thoughtNumber).toBe(1);
      expect(thoughts[1].thoughtNumber).toBe(2);
    });

    it('retrieves a single thought by number', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Single Thought' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 2 }));

      const thought = await storage.getThought(session.id, 2);
      expect(thought).not.toBeNull();
      expect(thought!.thoughtNumber).toBe(2);

      const missing = await storage.getThought(session.id, 99);
      expect(missing).toBeNull();
    });

    it('getAllThoughts includes branches', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'All Thoughts' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 2 }));
      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 3,
        branchFromThought: 1,
        branchId: 'alt-1',
      }));

      const all = await storage.getAllThoughts(session.id);
      expect(all).toHaveLength(3);
    });
  });

  describe('H1: Branch operations', () => {
    it('saves and retrieves branch thoughts', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Branches' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 2,
        branchFromThought: 1,
        branchId: 'alt-1',
      }));
      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 3,
        branchId: 'alt-1',
      }));

      const branchIds = await storage.getBranchIds(session.id);
      expect(branchIds).toContain('alt-1');

      const branchThoughts = await storage.getBranch(session.id, 'alt-1');
      expect(branchThoughts).toHaveLength(2);
      expect(branchThoughts[0].thoughtNumber).toBe(2);
      expect(branchThoughts[1].thoughtNumber).toBe(3);
    });
  });

  describe('H1: Critique update', () => {
    it('updates thought with critique metadata', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Critique Test' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      const critique = {
        text: 'This reasoning has a gap.',
        model: 'claude-3-opus',
        timestamp: new Date().toISOString(),
      };

      await storage.updateThoughtCritique(session.id, 1, critique);

      const thought = await storage.getThought(session.id, 1);
      expect(thought!.critique).toEqual(critique);
    });
  });

  describe('H1: Export operations', () => {
    it('exports session as JSON', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Export Test' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      const json = await storage.exportSession(session.id, 'json');
      const parsed = JSON.parse(json);
      expect(parsed.session.title).toBe('Export Test');
      expect(parsed.thoughts).toHaveLength(1);
    });

    it('exports session as markdown', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'MD Export' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      const md = await storage.exportSession(session.id, 'markdown');
      expect(md).toContain('# MD Export');
      expect(md).toContain('Thought 1/5');
    });
  });

  // ===========================================================================
  // H2: ThoughtNode linked-list reconstruction
  // ===========================================================================

  describe('H2: Linked-list reconstruction via toLinkedExport', () => {
    it('reconstructs prev/next pointers for main chain + branches + revision', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Linked Test' });

      // Main chain: 5 thoughts
      for (let i = 1; i <= 5; i++) {
        await storage.saveThought(session.id, makeThought({
          thoughtNumber: i,
          totalThoughts: 5,
          nextThoughtNeeded: i < 5,
        }));
      }

      // Branch from thought 3: 2 branch thoughts
      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 6,
        totalThoughts: 7,
        branchFromThought: 3,
        branchId: 'alt-1',
      }));
      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 7,
        totalThoughts: 7,
        branchId: 'alt-1',
      }));

      // Revision of thought 2
      await storage.saveThought(session.id, makeThought({
        thoughtNumber: 8,
        totalThoughts: 8,
        isRevision: true,
        revisesThought: 2,
      }));

      const exported = await storage.toLinkedExport(session.id);

      expect(exported.version).toBe('1.0');
      expect(exported.session.title).toBe('Linked Test');
      expect(exported.nodes).toHaveLength(8);

      // First main chain node has no prev
      const firstNode = exported.nodes.find(n => n.data.thoughtNumber === 1 && !n.branchId);
      expect(firstNode).toBeDefined();
      expect(firstNode!.prev).toBeNull();
      expect(firstNode!.next.length).toBeGreaterThan(0);

      // Branch node 6 should have branchOrigin pointing to thought 3
      const branchNode = exported.nodes.find(n => n.data.thoughtNumber === 6);
      expect(branchNode).toBeDefined();
      expect(branchNode!.branchOrigin).toContain(':3');
      expect(branchNode!.branchId).toBe('alt-1');

      // Revision node 8 should have revisesNode pointing to thought 2
      const revisionNode = exported.nodes.find(n => n.data.thoughtNumber === 8);
      expect(revisionNode).toBeDefined();
      expect(revisionNode!.revisesNode).toContain(':2');
    });
  });

  // ===========================================================================
  // H5: UNIQUE NULLS NOT DISTINCT constraint
  // ===========================================================================

  describe('H5: Unique constraint on (session_id, thought_number, branch_id)', () => {
    it('rejects duplicate (session, thought_number, NULL branch_id)', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Unique Test' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      await expect(
        storage.saveThought(session.id, makeThought({ thoughtNumber: 1 })),
      ).rejects.toThrow();
    });

    it('allows same thought_number on different branches', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Branch Unique' });
      await storage.saveThought(session.id, makeThought({ thoughtNumber: 1 }));

      await storage.saveBranchThought(session.id, 'alt-1', makeThought({
        thoughtNumber: 1,
        branchId: 'alt-1',
        branchFromThought: 1,
      }));

      const all = await storage.getAllThoughts(session.id);
      expect(all).toHaveLength(2);
    });
  });

  // ===========================================================================
  // H7: Trigger-based count consistency
  // ===========================================================================

  describe('H7: Trigger-based session counts with parallel writes', () => {
    it('maintains correct thought_count after 20 parallel saveThought calls', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Parallel Writes' });

      const promises = Array.from({ length: 20 }, (_, i) =>
        storage.saveThought(session.id, makeThought({
          thoughtNumber: i + 1,
          totalThoughts: 20,
        })),
      );

      await Promise.all(promises);

      const updated = await storage.getSession(session.id);
      expect(updated).not.toBeNull();
      expect(updated!.thoughtCount).toBe(20);
    });
  });

  // ===========================================================================
  // Config and integrity
  // ===========================================================================

  describe('Config operations (in-memory)', () => {
    it('returns config after update', async ({ skip }) => {
      if (!available) skip();
      const config = await storage.updateConfig({ disableThoughtLogging: true });
      expect(config.disableThoughtLogging).toBe(true);

      const fetched = await storage.getConfig();
      expect(fetched).not.toBeNull();
      expect(fetched!.disableThoughtLogging).toBe(true);
    });
  });

  describe('Integrity validation', () => {
    it('returns valid for existing session', async ({ skip }) => {
      if (!available) skip();
      const session = await storage.createSession({ title: 'Integrity' });
      const result = await storage.validateSessionIntegrity(session.id);
      expect(result.valid).toBe(true);
      expect(result.sessionExists).toBe(true);
    });

    it('returns invalid for missing session', async ({ skip }) => {
      if (!available) skip();
      const result = await storage.validateSessionIntegrity('00000000-0000-0000-0000-000000000000');
      expect(result.valid).toBe(false);
      expect(result.sessionExists).toBe(false);
    });
  });


});
