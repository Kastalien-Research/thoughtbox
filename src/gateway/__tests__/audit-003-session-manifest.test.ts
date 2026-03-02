/**
 * AUDIT-003: Session Manifest Auto-Generation
 * Tests manifest generation at session close, manifest shape,
 * and audit_manifest retrieval via deep_analysis.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../../thought-handler.js';
import { InMemoryStorage } from '../../persistence/index.js';
import { GatewayHandler } from '../gateway-handler.js';
import { ToolRegistry, DisclosureStage } from '../../tool-registry.js';

describe('AUDIT-003: Session Manifest', () => {
  let thoughtHandler: ThoughtHandler;
  let storage: InMemoryStorage;
  let gateway: GatewayHandler;
  const mcpSessionId = 'test-session';

  beforeEach(async () => {
    storage = new InMemoryStorage();
    thoughtHandler = new ThoughtHandler(true, storage);
    await thoughtHandler.initialize();

    const toolRegistry = new ToolRegistry();
    gateway = new GatewayHandler({
      toolRegistry,
      initToolHandler: {} as any,
      thoughtHandler,
      notebookHandler: {} as any,
      sessionHandler: {} as any,
      mentalModelsHandler: {} as any,
      storage,
    });
    gateway.setSessionStage(
      mcpSessionId,
      DisclosureStage.STAGE_2_CIPHER_LOADED
    );
  });

  async function submitThought(args: Record<string, unknown>) {
    return gateway.handle(
      { operation: 'thought', args },
      mcpSessionId
    );
  }

  async function submitFullSequenceAndClose() {
    await submitThought({
      thought: 'Context',
      thoughtType: 'context_snapshot',
      nextThoughtNeeded: true,
      contextData: { modelId: 'test' },
    });
    await submitThought({
      thought: 'Decision 1',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'low',
      options: [{ label: 'A', selected: true }],
    });
    await submitThought({
      thought: 'Action 1',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'deploy',
        target: 'staging',
      },
    });
    await submitThought({
      thought: 'Assumption changed',
      thoughtType: 'assumption_update',
      nextThoughtNeeded: true,
      assumptionChange: {
        text: 'DB is fast',
        oldStatus: 'believed',
        newStatus: 'refuted',
      },
    });
    await submitThought({
      thought: 'Decision 2',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [{ label: 'B', selected: true }],
    });
    await submitThought({
      thought: 'Action 2',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: false,
        reversible: 'no',
        tool: 'migrate',
        target: 'prod-db',
      },
    });
    // Close session
    const closeResult = await submitThought({
      thought: 'Done',
      thoughtType: 'reasoning',
      nextThoughtNeeded: false,
    });
    return closeResult;
  }

  // T-AUDIT-003-1: Manifest in session-close response
  it('includes auditManifest in session-close response', async () => {
    const result = await submitFullSequenceAndClose();
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.sessionClosed).toBe(true);
    expect(data.auditManifest).toBeDefined();
    expect(data.auditManifest.sessionId).toBeDefined();
  });

  // T-AUDIT-003-2: Thought counts match
  it('manifest thought counts match submitted thoughts', async () => {
    const result = await submitFullSequenceAndClose();
    const data = JSON.parse(result.content[0].text);
    const m = data.auditManifest;
    expect(m.thoughtCounts.total).toBe(7);
    expect(m.thoughtCounts.context_snapshot).toBe(1);
    expect(m.thoughtCounts.decision_frame).toBe(2);
    expect(m.thoughtCounts.action_report).toBe(2);
    expect(m.thoughtCounts.assumption_update).toBe(1);
    expect(m.thoughtCounts.reasoning).toBe(1);
  });

  // T-AUDIT-003-3: Decision confidence breakdown
  it('manifest has correct decision confidence breakdown', async () => {
    const result = await submitFullSequenceAndClose();
    const m = JSON.parse(result.content[0].text).auditManifest;
    expect(m.decisions.total).toBe(2);
    expect(m.decisions.byConfidence.low).toBe(1);
    expect(m.decisions.byConfidence.high).toBe(1);
  });

  // T-AUDIT-003-4: Action aggregation
  it('manifest has correct action aggregation', async () => {
    const result = await submitFullSequenceAndClose();
    const m = JSON.parse(result.content[0].text).auditManifest;
    expect(m.actions.total).toBe(2);
    expect(m.actions.successful).toBe(1);
    expect(m.actions.failed).toBe(1);
    expect(m.actions.reversible).toBe(1);
    expect(m.actions.irreversible).toBe(1);
  });

  // T-AUDIT-003-5: Gap detection
  it('manifest detects decision-without-action gaps', async () => {
    // Decision 1 (thought 2) -> Action 1 (thought 3): within 5 thoughts
    // Decision 2 (thought 5) -> Action 2 (thought 6): within 5 thoughts
    // So no gaps expected in this sequence
    const result = await submitFullSequenceAndClose();
    const m = JSON.parse(result.content[0].text).auditManifest;
    const decisionGaps = m.gaps.filter(
      (g: any) => g.type === 'decision_without_action'
    );
    expect(decisionGaps).toHaveLength(0);
  });

  // T-AUDIT-003-6: Assumption flips
  it('manifest counts assumption flips', async () => {
    const result = await submitFullSequenceAndClose();
    const m = JSON.parse(result.content[0].text).auditManifest;
    expect(m.assumptionFlips).toBe(1);
  });

  // T-AUDIT-003-7: audit_manifest via deep_analysis on closed session
  it('retrieves audit_manifest via deep_analysis', async () => {
    await submitFullSequenceAndClose();
    const sessions = await storage.listSessions();
    expect(sessions.length).toBeGreaterThan(0);
    const sessionId = sessions[0].id;

    const result = await gateway.handle(
      {
        operation: 'deep_analysis',
        args: { sessionId, analysisType: 'audit_manifest' },
      },
      mcpSessionId
    );
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.analysisType).toBe('audit_manifest');
    expect(data.manifest).toBeDefined();
    expect(data.manifest.thoughtCounts.total).toBe(7);
  });

  // T-AUDIT-003-8: audit_manifest via deep_analysis on open session
  it('computes audit_manifest for open session without error', async () => {
    await submitThought({
      thought: 'Open session thought',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    await submitThought({
      thought: 'Decision',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'medium',
      options: [{ label: 'X', selected: true }],
    });

    const sessionId = thoughtHandler.getCurrentSessionId()!;
    const result = await gateway.handle(
      {
        operation: 'deep_analysis',
        args: { sessionId, analysisType: 'audit_manifest' },
      },
      mcpSessionId
    );
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.manifest.thoughtCounts.total).toBe(2);
  });
});
