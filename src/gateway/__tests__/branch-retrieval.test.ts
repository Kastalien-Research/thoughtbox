/**
 * Branch Thought Retrieval Tests
 *
 * Verifies that branch thoughts are visible through gateway operations:
 * - get_structure: branchCount > 0, branches object populated
 * - deep_analysis: patterns.branchCount > 0, cognitiveLoad.breadthIndicator > 1
 * - read_thoughts (default): includes availableBranches listing branch names
 * - read_thoughts (branchId): returns correct branch thoughts (should already work)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GatewayHandler } from '../gateway-handler.js';
import { InMemoryStorage } from '../../persistence/storage.js';
import { ThoughtHandler } from '../../thought-handler.js';
import { ToolRegistry, DisclosureStage } from '../../tool-registry.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestDeps() {
  const storage = new InMemoryStorage();
  const toolRegistry = new ToolRegistry();
  const thoughtHandler = new ThoughtHandler(false, storage);

  // Advance to Stage 2 so all operations are available
  toolRegistry.advanceToStage(DisclosureStage.STAGE_1_INIT_COMPLETE);
  toolRegistry.advanceToStage(DisclosureStage.STAGE_2_CIPHER_LOADED);

  const gateway = new GatewayHandler({
    toolRegistry,
    initToolHandler: {} as any,
    thoughtHandler,
    notebookHandler: {} as any,
    sessionHandler: {} as any,
    mentalModelsHandler: {} as any,
    storage,
  });

  return { storage, toolRegistry, thoughtHandler, gateway };
}

async function setupSessionWithBranches(
  thoughtHandler: ThoughtHandler,
): Promise<string> {
  await thoughtHandler.initialize();

  // Add main chain thoughts (1-5)
  for (let i = 1; i <= 5; i++) {
    await thoughtHandler.processThought({
      thought: `Main thought ${i}`,
      thoughtNumber: i,
      totalThoughts: 10,
      nextThoughtNeeded: true,
      sessionTitle: 'Branch Test Session',
      sessionTags: ['test'],
    });
  }

  // Add branch "explore-alt" forking from thought 3, with thoughts 6-8
  await thoughtHandler.processThought({
    thought: 'Branch explore-alt thought 6',
    thoughtNumber: 6,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 3,
    branchId: 'explore-alt',
  });
  await thoughtHandler.processThought({
    thought: 'Branch explore-alt thought 7',
    thoughtNumber: 7,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 3,
    branchId: 'explore-alt',
  });
  await thoughtHandler.processThought({
    thought: 'Branch explore-alt thought 8',
    thoughtNumber: 8,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 3,
    branchId: 'explore-alt',
  });

  // Add branch "deep-dive" forking from thought 5, with thoughts 9-10
  await thoughtHandler.processThought({
    thought: 'Branch deep-dive thought 9',
    thoughtNumber: 9,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 5,
    branchId: 'deep-dive',
  });
  await thoughtHandler.processThought({
    thought: 'Branch deep-dive thought 10',
    thoughtNumber: 10,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 5,
    branchId: 'deep-dive',
  });

  const sessionId = thoughtHandler.getCurrentSessionId();
  if (!sessionId) throw new Error('No session created');
  return sessionId;
}

// =============================================================================
// Tests
// =============================================================================

describe('Branch Thought Retrieval', () => {
  let gateway: GatewayHandler;
  let thoughtHandler: ThoughtHandler;
  let storage: InMemoryStorage;
  let sessionId: string;

  beforeEach(async () => {
    const deps = createTestDeps();
    gateway = deps.gateway;
    thoughtHandler = deps.thoughtHandler;
    storage = deps.storage;
    sessionId = await setupSessionWithBranches(thoughtHandler);
  });

  describe('get_structure with branches', () => {
    it('reports branchCount > 0 when branches exist', async () => {
      const result = await gateway.handle({
        operation: 'get_structure',
        args: { sessionId },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.branchCount).toBe(2);
    });

    it('populates branches object with fork points and lengths', async () => {
      const result = await gateway.handle({
        operation: 'get_structure',
        args: { sessionId },
      });

      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      // explore-alt: forked from thought 3, 3 thoughts (6,7,8)
      expect(data.branches['explore-alt']).toBeDefined();
      expect(data.branches['explore-alt'].forks).toBe(3);
      expect(data.branches['explore-alt'].length).toBe(3);
      expect(data.branches['explore-alt'].range).toEqual([6, 8]);

      // deep-dive: forked from thought 5, 2 thoughts (9,10)
      expect(data.branches['deep-dive']).toBeDefined();
      expect(data.branches['deep-dive'].forks).toBe(5);
      expect(data.branches['deep-dive'].length).toBe(2);
      expect(data.branches['deep-dive'].range).toEqual([9, 10]);
    });

    it('reports correct totalThoughts including branches', async () => {
      const result = await gateway.handle({
        operation: 'get_structure',
        args: { sessionId },
      });

      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      // 5 main + 3 explore-alt + 2 deep-dive = 10
      expect(data.totalThoughts).toBe(10);
    });

    it('mainChain only contains non-branch thoughts', async () => {
      const result = await gateway.handle({
        operation: 'get_structure',
        args: { sessionId },
      });

      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.mainChain.length).toBe(5);
      expect(data.mainChain.head).toBe(1);
      expect(data.mainChain.tail).toBe(5);
    });
  });

  describe('deep_analysis with branches', () => {
    it('reports branchCount > 0 in patterns', async () => {
      const result = await gateway.handle({
        operation: 'deep_analysis',
        args: { sessionId, analysisType: 'patterns' },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.patterns.branchCount).toBe(2);
    });

    it('reports breadthIndicator > 1 in cognitive load', async () => {
      const result = await gateway.handle({
        operation: 'deep_analysis',
        args: { sessionId, analysisType: 'cognitive_load' },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      // breadthIndicator = unique branchId values + 'main' = 3
      expect(data.cognitiveLoad.breadthIndicator).toBeGreaterThan(1);
    });

    it('full analysis includes both branch metrics', async () => {
      const result = await gateway.handle({
        operation: 'deep_analysis',
        args: { sessionId, analysisType: 'full' },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.patterns.branchCount).toBe(2);
      expect(data.patterns.totalThoughts).toBe(10);
      expect(data.cognitiveLoad.breadthIndicator).toBe(3); // main + 2 branches
    });
  });

  describe('branchFromThought validation', () => {
    it('rejects branchFromThought: 0 with bounds error, not missing-field error', async () => {
      const result = await thoughtHandler.processThought({
        thought: 'Attempting branch from thought 0',
        thoughtNumber: 6,
        totalThoughts: 10,
        nextThoughtNeeded: true,
        branchFromThought: 0,
        branchId: 'bad-branch',
      });

      expect(result.isError).toBe(true);
      const text = result.content[0].type === 'text' ? (result.content[0] as any).text : '';
      expect(text).toContain('branchFromThought must be >= 1');
    });

    it('still rejects branchId without branchFromThought', async () => {
      const result = await thoughtHandler.processThought({
        thought: 'Attempting branch without fork point',
        thoughtNumber: 6,
        totalThoughts: 10,
        nextThoughtNeeded: true,
        branchId: 'orphan-branch',
      });

      expect(result.isError).toBe(true);
      const text = result.content[0].type === 'text' ? (result.content[0] as any).text : '';
      expect(text).toContain('branchId requires branchFromThought');
    });
  });

  describe('read_thoughts with branches', () => {
    it('default mode includes availableBranches', async () => {
      const result = await gateway.handle({
        operation: 'read_thoughts',
        args: { sessionId },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.availableBranches).toBeDefined();
      expect(data.availableBranches).toContain('explore-alt');
      expect(data.availableBranches).toContain('deep-dive');
    });

    it('branchId query returns correct branch thoughts', async () => {
      const result = await gateway.handle({
        operation: 'read_thoughts',
        args: { sessionId, branchId: 'explore-alt' },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].type === 'text' ? (result.content[0] as any).text : '{}');

      expect(data.count).toBe(3);
      expect(data.thoughts[0].branchId).toBe('explore-alt');
      expect(data.thoughts[0].thoughtNumber).toBe(6);
    });
  });
});
