/**
 * Integration test for the thoughts-as-runbook pattern.
 *
 * Runs the full 10-thought session from runbook-via-thoughts.md against
 * a real ThoughtHandler + GatewayHandler and verifies:
 * - All 10 thoughts are accepted without error
 * - read_thoughts with thoughtType filter returns correct counts
 * - The session closes with an audit manifest
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../src/thought-handler.js';
import { InMemoryStorage } from '../src/persistence/index.js';
import { GatewayHandler } from '../src/gateway/gateway-handler.js';
import {
  ToolRegistry,
  DisclosureStage,
} from '../src/tool-registry.js';

describe('Thoughts-as-Runbook: 10-thought session', () => {
  let thoughtHandler: ThoughtHandler;
  let storage: InMemoryStorage;
  let gateway: GatewayHandler;
  const mcpSessionId = 'runbook-test';

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

  async function submitThought(
    args: Record<string, unknown>
  ) {
    return gateway.handle(
      { operation: 'thought', args },
      mcpSessionId
    );
  }

  async function readThoughts(
    args: Record<string, unknown>
  ) {
    return gateway.handle(
      { operation: 'read_thoughts', args },
      mcpSessionId
    );
  }

  async function deepAnalysis(
    args: Record<string, unknown>
  ) {
    return gateway.handle(
      { operation: 'deep_analysis', args },
      mcpSessionId
    );
  }

  function parseResult(
    result: { content: Array<{ text: string }> }
  ) {
    return JSON.parse(result.content[0].text);
  }

  /**
   * Submit all 10 thoughts from the runbook demo.
   * Returns results array for assertions.
   */
  async function runFullSession() {
    const results = [];

    // Thought 1: Plan (reasoning)
    results.push(await submitThought({
      thought: 'I will refactor the weather-mcp-server from Python to TypeScript. Subtasks: 1) Analyze Python handlers, 2) Set up TypeScript project, 3) Convert handlers, 4) Convert types, 5) Write tests, 6) Verify.',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
      sessionTitle: 'Refactor weather-mcp-server: Python to TypeScript',
      sessionTags: ['task:refactor', 'lang:python-to-typescript'],
    }));

    // Thought 2: Project structure decision (decision_frame)
    results.push(await submitThought({
      thought: 'Choosing TypeScript project structure. Single package matches the simplicity of the Python original.',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [
        { label: 'Single package with src/', selected: true, reason: 'Matches Python simplicity' },
        { label: 'Turborepo monorepo', selected: false, reason: 'Overkill for 3 handlers' },
      ],
    }));

    // Thought 3: Python analysis complete (action_report)
    results.push(await submitThought({
      thought: 'Analyzed all 3 Python handlers. Extracted interface contracts for get_forecast, get_alerts, get_historical.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'code_analysis',
        target: 'weather_mcp/handlers.py',
      },
    }));

    // Thought 4: TypeScript project set up (action_report)
    results.push(await submitThought({
      thought: 'Created TypeScript project with @modelcontextprotocol/sdk, zod, typescript. ESM output, strict mode.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'shell',
        target: 'weather-mcp-server-ts/',
      },
    }));

    // Thought 5: Handlers converted (action_report)
    results.push(await submitThought({
      thought: 'Converted all 3 handlers to TypeScript. Using native fetch instead of httpx.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'partial',
        tool: 'file_write',
        target: 'src/handlers/',
      },
    }));

    // Thought 6: Dynamic dispatch observation (reasoning)
    results.push(await submitThought({
      thought: 'Python dynamic dispatch (HANDLERS dict) is replaced by MCP SDK native tool routing. No additional work needed.',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    }));

    // Thought 7: Type representation decision (decision_frame)
    results.push(await submitThought({
      thought: 'Choosing type representation. Zod schemas provide runtime validation and TypeScript types from single source.',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [
        { label: 'Zod schemas with inferred types', selected: true, reason: 'Already using zod, consistent approach' },
        { label: 'Plain TypeScript interfaces', selected: false, reason: 'No runtime validation' },
        { label: 'Class hierarchy', selected: false, reason: 'Too heavy for DTOs' },
      ],
    }));

    // Thought 8: Types converted (action_report)
    results.push(await submitThought({
      thought: 'Converted shared types to zod schemas: WeatherData, Location, Alert. Updated all handlers.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'file_write',
        target: 'src/types.ts',
      },
    }));

    // Thought 9: Tests passing (action_report)
    results.push(await submitThought({
      thought: 'Wrote 12 integration tests. All passing. Coverage: 94% line, 88% branch.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'vitest',
        target: 'src/__tests__/',
      },
    }));

    // Thought 10: Final summary (reasoning, closes session)
    results.push(await submitThought({
      thought: 'Refactoring complete. 3 handlers converted, zod schemas for types, 12 tests passing. Two decisions: single-package (over monorepo), zod (over interfaces).',
      thoughtType: 'reasoning',
      nextThoughtNeeded: false,
    }));

    return results;
  }

  it('accepts all 10 thoughts without error', async () => {
    const results = await runFullSession();

    expect(results).toHaveLength(10);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      expect(
        result.isError,
        `Thought ${i + 1} returned an error: ${result.content[0].text}`
      ).toBeUndefined();
    }
  });

  it('assigns correct thought numbers 1 through 10', async () => {
    const results = await runFullSession();

    for (let i = 0; i < results.length; i++) {
      const data = parseResult(results[i]);
      expect(data.thoughtNumber).toBe(i + 1);
    }
  });

  it('read_thoughts with thoughtType=decision_frame returns 2', async () => {
    // Run 9 thoughts (session still open), then query
    const results = await runFullSession();
    // Session closed on thought 10, need a session ID from before close
    // Use a fresh run where we stop before close
    // Actually: after session closes, read_thoughts still works if we
    // captured the sessionId. Let's get it from thought 1's response.
    const thought1Data = parseResult(results[0]);
    const sessionId = thought1Data.sessionId;

    // After session close, we need to pass sessionId explicitly
    // But the gateway read_thoughts uses the active session or a provided one
    // Since session closed, we must provide sessionId
    // Use last: 100 to fetch all thoughts before filtering.
    // Without it, the gateway defaults to last 5 and filters within that window.
    const readResult = await readThoughts({
      sessionId,
      thoughtType: 'decision_frame',
      last: 100,
    });
    const data = parseResult(readResult);

    expect(data.count).toBe(2);
    expect(data.filter.thoughtType).toBe('decision_frame');
  });

  it('read_thoughts with thoughtType=action_report returns 5', async () => {
    const results = await runFullSession();
    const sessionId = parseResult(results[0]).sessionId;

    const readResult = await readThoughts({
      sessionId,
      thoughtType: 'action_report',
      last: 100,
    });
    const data = parseResult(readResult);

    expect(data.count).toBe(5);
    expect(data.filter.thoughtType).toBe('action_report');
  });

  it('read_thoughts with thoughtType=reasoning returns 3', async () => {
    const results = await runFullSession();
    const sessionId = parseResult(results[0]).sessionId;

    const readResult = await readThoughts({
      sessionId,
      thoughtType: 'reasoning',
      last: 100,
    });
    const data = parseResult(readResult);

    expect(data.count).toBe(3);
  });

  it('session closes with audit manifest on thought 10', async () => {
    const results = await runFullSession();
    const finalData = parseResult(results[9]);

    expect(finalData.sessionClosed).toBe(true);
    expect(finalData.thoughtHistoryLength).toBe(10);
    expect(finalData.auditManifest).toBeDefined();
    expect(finalData.auditManifest.thoughtCounts.total).toBe(10);
  });

  it('audit_summary via deep_analysis returns correct aggregation', async () => {
    const results = await runFullSession();
    const sessionId = parseResult(results[0]).sessionId;

    const analysisResult = await deepAnalysis({
      sessionId,
      analysisType: 'audit_summary',
    });
    expect(analysisResult.isError).toBeUndefined();

    const data = parseResult(analysisResult);
    expect(data.analysisType).toBe('audit_summary');
    expect(data.thoughtCounts.total).toBe(10);
    expect(data.thoughtCounts.reasoning).toBe(3);
    expect(data.thoughtCounts.decision_frame).toBe(2);
    expect(data.thoughtCounts.action_report).toBe(5);
    expect(data.decisions.total).toBe(2);
    expect(data.decisions.byConfidence.high).toBe(2);
    expect(data.actions.successful).toBe(5);
  });
});
