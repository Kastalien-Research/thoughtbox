/**
 * End-to-end Code Mode tests for tb.merge.* (SPEC-MERGE-EVIDENCE c9):
 * request/status/list driven through thoughtbox_execute with the stub
 * evidence generator, sharing session identity with tb.hub.
 */

import { describe, it, expect } from 'vitest';
import { ExecuteTool } from '../../code-mode/execute-tool.js';
import { ThoughtTool } from '../../thought/tool.js';
import { SessionTool } from '../../sessions/tool.js';
import { NotebookTool } from '../../notebook/tool.js';
import { TheseusTool, UlyssesTool, InMemoryProtocolHandler } from '../../protocol/index.js';
import { ObservabilityGatewayHandler } from '../../observability/index.js';
import { ThoughtHandler } from '../../thought-handler.js';
import { SessionHandler } from '../../sessions/index.js';
import { NotebookHandler } from '../../notebook/index.js';
import { InMemoryStorage } from '../../persistence/index.js';
import { createHubToolHandler } from '../../hub/hub-tool-handler.js';
import { SessionIdentityRegistry } from '../../hub/session-identity.js';
import {
  createInMemoryHubStorage,
  createInMemoryThoughtStore,
} from '../../hub/__tests__/test-helpers.js';
import { createStubMergeEvidenceGenerator } from '../evidence-generator.js';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import { createMergeToolHandler } from '../merge-tool-handler.js';

const SESSION = 'merge-e2e-session';

function createHarness() {
  const storage = new InMemoryStorage();
  const thoughtHandler = new ThoughtHandler(true, storage);
  const sessionHandler = new SessionHandler({ storage, thoughtHandler });
  const notebookHandler = new NotebookHandler();
  const protocolHandler = new InMemoryProtocolHandler();

  const identityRegistry = new SessionIdentityRegistry();
  const hubToolHandler = createHubToolHandler({
    hubStorage: createInMemoryHubStorage(),
    thoughtStore: createInMemoryThoughtStore(),
    identityRegistry,
  });
  const mergeToolHandler = createMergeToolHandler({
    mergeStorage: new InMemoryMergeCommitStorage(),
    evidenceGenerator: createStubMergeEvidenceGenerator(),
    identityRegistry,
  });

  return new ExecuteTool({
    thoughtTool: new ThoughtTool(thoughtHandler),
    sessionTool: new SessionTool(sessionHandler),
    notebookTool: new NotebookTool(notebookHandler),
    theseusTool: new TheseusTool(protocolHandler),
    ulyssesTool: new UlyssesTool(protocolHandler),
    observabilityHandler: new ObservabilityGatewayHandler({ storage }),
    hubDispatcher: {
      handle: input => hubToolHandler.handle(input, SESSION),
    },
    mergeDispatcher: {
      handle: input => mergeToolHandler.handle(input, SESSION),
    },
  });
}

async function run(tool: ExecuteTool, code: string) {
  const result = await tool.handle({ code });
  return JSON.parse(result.content[0]!.text);
}

describe('tb.merge end-to-end via thoughtbox_execute', () => {
  it('request -> status -> list with the stub generator', async () => {
    const tool = createHarness();

    const registered = await run(
      tool,
      `async () => tb.hub.register({ name: "merge-e2e-agent" })`,
    );
    expect(registered.error).toBeUndefined();
    const agentId = registered.result.agentId;

    const requested = await run(
      tool,
      `async () => tb.merge.request({ workspaceId: "ws-1", branchIds: ["branch-a", "branch-b"] })`,
    );
    expect(requested.error).toBeUndefined();
    const record = requested.result;
    expect(record.status).toBe('pending_approval');
    expect(record.requestedBy).toBe(agentId);
    // Stub evidence is prose-only: forced-low confidence (c2).
    expect(record.verdict.confidence).toBe('low');
    expect(record.evidenceHash).toMatch(/^[0-9a-f]{64}$/);

    const status = await run(
      tool,
      `async () => tb.merge.status({ mergeId: ${JSON.stringify(record.id)} })`,
    );
    expect(status.error).toBeUndefined();
    expect(status.result.id).toBe(record.id);
    expect(status.result.status).toBe('pending_approval');

    const list = await run(
      tool,
      `async () => tb.merge.list({ workspaceId: "ws-1", status: "pending_approval" })`,
    );
    expect(list.error).toBeUndefined();
    expect(list.result.count).toBe(1);
    expect(list.result.merges[0].id).toBe(record.id);
  });

  it('tb.merge has no approve method (human-only approval, c4)', async () => {
    const tool = createHarness();
    const output = await run(tool, `async () => typeof tb.merge.approve`);
    expect(output.result).toBe('undefined');
  });

  it('request without registration fails with hub guidance', async () => {
    const tool = createHarness();
    const output = await run(
      tool,
      `async () => tb.merge.request({ workspaceId: "ws-1", branchIds: ["b"] })`,
    );
    expect(output.error).toContain('tb.hub.register');
  });

  it('tb.merge.* fails cleanly when no merge storage is wired', async () => {
    const storage = new InMemoryStorage();
    const thoughtHandler = new ThoughtHandler(true, storage);
    const protocolHandler = new InMemoryProtocolHandler();
    const tool = new ExecuteTool({
      thoughtTool: new ThoughtTool(thoughtHandler),
      sessionTool: new SessionTool(new SessionHandler({ storage, thoughtHandler })),
      notebookTool: new NotebookTool(new NotebookHandler()),
      theseusTool: new TheseusTool(protocolHandler),
      ulyssesTool: new UlyssesTool(protocolHandler),
      observabilityHandler: new ObservabilityGatewayHandler({ storage }),
    });
    const output = await run(tool, `async () => tb.merge.list({ workspaceId: "ws-1" })`);
    expect(output.error).toContain('Merge operations are unavailable');
  });
});
